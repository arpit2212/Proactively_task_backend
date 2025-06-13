const express = require('express');
const supabase = require('../config/supabase');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Add debugging middleware to see what routes are being hit
router.use((req, res, next) => {
  console.log('=== FORMS ROUTER DEBUG ===');
  console.log(`Method: ${req.method}`);
  console.log(`URL: ${req.url}`);
  console.log(`Original URL: ${req.originalUrl}`);
  console.log('Body:', req.body);
  console.log('========================');
  next();
});

// Generate random share code
const generateShareCode = () => {     
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

// Helper function to check if a string is a UUID
const isUUID = (str) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// Helper function to check if user has access to form
const hasFormAccess = async (formId, userId) => {
  // Check if user is the creator
  const { data: form } = await supabase
    .from('forms')
    .select('created_by')
    .eq('id', formId)
    .single();
  
  if (form && form.created_by === userId) {
    return true;
  }
  
  // Check if user is a collaborator
  const { data: collaborator } = await supabase
    .from('form_collaborators')
    .select('id')
    .eq('form_id', formId)
    .eq('user_id', userId)
    .single();
  
  return !!collaborator;
};

// === Join Form === (IMPROVED VERSION - Handles both share codes and form IDs)
router.post('/join', authenticateToken, async (req, res) => {
  console.log('=== JOIN ROUTE HIT ===');
  console.log('Request body:', req.body);
  console.log('User from token:', req.user);
  
  try {
    const { shareCode } = req.body;
    const userId = req.user.userId;

    console.log('Join attempt with data:', { shareCode, userId });

    if (!shareCode) {
      console.log('No share code provided');
      return res.status(400).json({ error: 'Share code is required' });
    }

    const normalizedInput = shareCode.trim();
    console.log('Looking for form with input:', normalizedInput);

    let form = null;
    let formError = null;

    // Check if input is a UUID (form ID) or a share code
    if (isUUID(normalizedInput)) {
      console.log('Input appears to be a form ID (UUID)');
      // Try to find form by ID
      const { data: formById, error: formByIdError } = await supabase
        .from('forms')
        .select('*')
        .eq('id', normalizedInput)
        .eq('is_active', true)
        .single();
      
      form = formById;
      formError = formByIdError;
      console.log('Form lookup by ID result:', { 
        found: !!form, 
        formId: form?.id, 
        error: formError?.message 
      });
    } else {
      console.log('Input appears to be a share code');
      // Try to find form by share code (normalize to uppercase)
      const normalizedShareCode = normalizedInput.toUpperCase();
      const { data: formByCode, error: formByCodeError } = await supabase
        .from('forms')
        .select('*')
        .eq('share_code', normalizedShareCode)
        .eq('is_active', true)
        .single();
      
      form = formByCode;
      formError = formByCodeError;
      console.log('Form lookup by share code result:', { 
        found: !!form, 
        formId: form?.id, 
        shareCode: normalizedShareCode,
        error: formError?.message 
      });
    }

    if (formError && formError.code !== 'PGRST116') {
      console.error('Database error:', formError);
      throw formError;
    }

    if (!form) {
      console.log('Form not found for input:', normalizedInput);
      return res.status(404).json({ error: 'Invalid share code or form not found' });
    }

    console.log('Form found:', form.id);

    // Check if user is already the creator
    if (form.created_by === userId) {
      console.log('User is already the creator of this form');
      return res.json({ 
        message: 'You are the creator of this form', 
        formId: form.id,
        userRole: 'creator'
      });
    }

    // Check if user is already a collaborator
    const { data: existing, error: collabCheckError } = await supabase
      .from('form_collaborators')
      .select('*')
      .eq('form_id', form.id)
      .eq('user_id', userId)
      .maybeSingle(); // Use maybeSingle instead of single

    if (collabCheckError) {
      console.error('Error checking collaboration:', collabCheckError);
      throw collabCheckError;
    }

    console.log('Existing collaboration check:', !!existing);

    if (!existing) {
      console.log('Adding user as collaborator');
      const { error: collabError } = await supabase
        .from('form_collaborators')
        .insert([{ 
          form_id: form.id, 
          user_id: userId,
          joined_at: new Date().toISOString()
        }]);

      if (collabError) {
        console.error('Error adding collaborator:', collabError);
        throw collabError;
      }
      console.log('Successfully added as collaborator');
    } else {
      console.log('User is already a collaborator');
    }

    console.log('Join successful, returning form ID:', form.id);
    res.json({ 
      message: 'Successfully joined form', 
      formId: form.id,
      userRole: existing ? 'existing_collaborator' : 'new_collaborator',
      formTitle: form.title
    });
  } catch (error) {
    console.error('=== JOIN FORM ERROR ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('======================');
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// === Create Form ===
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('=== CREATE FORM DEBUG ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User from token:', req.user);
    
    const { title, description, fields } = req.body;
    const userId = req.user.userId;

    console.log('Extracted data:', { title, description, fieldsCount: fields?.length, userId });

    if (!title || !fields || !Array.isArray(fields)) {
      console.log('Validation failed:', { title: !!title, fields: !!fields, isArray: Array.isArray(fields) });
      return res.status(400).json({ error: 'Title and fields are required' });
    }

    // Validate fields structure
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      console.log(`Field ${i}:`, field);
      
      if (!field.name || !field.type || !field.label) {
        console.log(`Field ${i} validation failed:`, { 
          name: !!field.name, 
          type: !!field.type, 
          label: !!field.label 
        });
        return res.status(400).json({ 
          error: `Field ${i + 1} is missing required properties (name, type, label)` 
        });
      }
    }

    console.log('All validations passed, generating share code...');

    // Unique share code
    let shareCode;
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      attempts++;
      shareCode = generateShareCode();
      console.log(`Share code attempt ${attempts}: ${shareCode}`);
      
      try {
        const { data: existing } = await supabase
          .from('forms')
          .select('id')
          .eq('share_code', shareCode)
          .single();
        
        console.log('Existing form with share code:', existing);
        if (!existing) isUnique = true;
      } catch (error) {
        console.log('Share code check error (this might be normal if no duplicates):', error.message);
        if (error.code === 'PGRST116') { // No rows found - this is good
          isUnique = true;
        } else {
          throw error;
        }
      }
    }

    if (!isUnique) {
      throw new Error('Could not generate unique share code after 10 attempts');
    }

    console.log('Creating form with data:', {
      title,
      description,
      created_by: userId,
      share_code: shareCode
    });

    // Create form
    const { data: form, error: formError } = await supabase
      .from('forms')
      .insert([{ 
        title, 
        description, 
        created_by: userId, 
        share_code: shareCode 
      }])
      .select()
      .single();

    if (formError) {
      console.error('Form creation error:', formError);
      throw formError;
    }

    console.log('Form created successfully:', form);

    // Prepare form fields
    const formFields = fields.map((field, index) => {
      const fieldData = {
        form_id: form.id,
        field_name: field.name,
        field_type: field.type,
        field_label: field.label,
        field_options: field.options || null,
        is_required: field.required || false,
        field_order: index
      };
      console.log(`Prepared field ${index}:`, fieldData);
      return fieldData;
    });

    console.log('Creating form fields:', formFields);

    // Create form fields
    const { data: createdFields, error: fieldsError } = await supabase
      .from('form_fields')
      .insert(formFields)
      .select();

    if (fieldsError) {
      console.error('Form fields creation error:', fieldsError);
      throw fieldsError;
    }

    console.log('Form fields created successfully:', createdFields);

    // Create initial form response
    console.log('Creating initial form response for form:', form.id);
    
    const { error: responseError } = await supabase
      .from('form_responses')
      .insert([{ 
        form_id: form.id, 
        response_data: {}, 
        last_updated_by: userId 
      }]);

    if (responseError) {
      console.error('Form response creation error:', responseError);
      throw responseError;
    }

    console.log('Form response created successfully');

    const result = { form: { ...form, fields: createdFields } };
    console.log('Sending response:', result);

    res.status(201).json(result);
  } catch (error) {
    console.error('=== CREATE FORM ERROR ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error details:', error.details);
    console.error('Error hint:', error.hint);
    console.error('Stack trace:', error.stack);
    console.error('=========================');
    
    // Send more specific error message
    let errorMessage = 'Internal server error';
    if (error.message) {
      errorMessage = error.message;
    }
    if (error.code === '23505') {
      errorMessage = 'Duplicate share code generated';
    }
    if (error.code === '23503') {
      errorMessage = 'Foreign key constraint violation';
    }
    if (error.code === '42501') {
      errorMessage = 'Permission denied';
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// === Get All Forms ===
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get forms created by user
    const { data: ownedForms, error: ownedError } = await supabase
      .from('forms')
      .select('*, form_fields(*), form_collaborators(*)')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (ownedError) throw ownedError;

    // Get forms where user is a collaborator
    const { data: collaborations, error: collabError } = await supabase
      .from('form_collaborators')
      .select('form_id')
      .eq('user_id', userId);

    if (collabError) throw collabError;

    let collaboratedForms = [];
    if (collaborations && collaborations.length > 0) {
      const formIds = collaborations.map(c => c.form_id);
      const { data: collabFormsData, error: collabFormsError } = await supabase
        .from('forms')
        .select('*, form_fields(*), form_collaborators(*)')
        .in('id', formIds)
        .order('created_at', { ascending: false });

      if (collabFormsError) throw collabFormsError;
      collaboratedForms = collabFormsData || [];
    }

    // Combine and deduplicate forms
    const allForms = [...(ownedForms || []), ...collaboratedForms];
    const uniqueForms = allForms.filter((form, index, self) => 
      index === self.findIndex(f => f.id === form.id)
    );

    res.json({ forms: uniqueForms });
  } catch (error) {
    console.error('Get forms error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// === Get Single Form === (IMPROVED ERROR HANDLING)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const formId = req.params.id;
    const userId = req.user.userId;

    console.log('Fetching form:', formId, 'for user:', userId);

    // First, try to get the form data directly
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select(`
        *,
        form_fields(*),
        form_responses(*),
        users!forms_created_by_fkey(username)
      `)
      .eq('id', formId)
      .single();

    if (formError) {
      console.error('Form fetch error:', formError);
      if (formError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Form not found' });
      }
      throw formError;
    }

    if (!form) {
      console.log('Form not found:', formId);
      return res.status(404).json({ error: 'Form not found' });
    }

    // Check if user has access to this form
    const hasAccess = await hasFormAccess(formId, userId);
    if (!hasAccess) {
      console.log('User does not have access to form:', formId);
      return res.status(403).json({ error: 'Access denied to this form' });
    }

    // Sort fields by order
    if (form.form_fields) {
      form.form_fields.sort((a, b) => a.field_order - b.field_order);
    }

    // Transform the data to match frontend expectations
    const transformedForm = {
      ...form,
      fields: form.form_fields?.map(field => ({
        id: field.id,
        name: field.field_name,
        type: field.field_type,
        label: field.field_label,
        options: field.field_options,
        required: field.is_required,
        placeholder: field.field_placeholder || ''
      })) || [],
      response: form.form_responses?.[0]?.response_data || {}
    };

    console.log('Sending transformed form:', transformedForm.id);
    res.json({ form: transformedForm });
  } catch (error) {
    console.error('Get form error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// === Update Form Response ===
router.post('/:id/response', authenticateToken, async (req, res) => {
  try {
    const formId = req.params.id;
    const { response } = req.body;
    const userId = req.user.userId;

    console.log('Updating form response:', formId, 'with data:', response);

    // Check if user has access to this form
    const hasAccess = await hasFormAccess(formId, userId);
    if (!hasAccess) {
      return res.status(404).json({ error: 'Form not found or access denied' });
    }

    // Get current response
    const { data: currentResponse } = await supabase
      .from('form_responses')
      .select('*')
      .eq('form_id', formId)
      .single();

    if (currentResponse) {
      // Update existing response
      const { data: updatedResponse, error: updateError } = await supabase
        .from('form_responses')
        .update({
          response_data: response,
          last_updated_by: userId,
          updated_at: new Date().toISOString()
        })
        .eq('form_id', formId)
        .select()
        .single();

      if (updateError) throw updateError;
      res.json({ message: 'Response updated successfully', response: updatedResponse });
    } else {
      // Create new response
      const { data: newResponse, error: createError } = await supabase
        .from('form_responses')
        .insert([{
          form_id: formId,
          response_data: response,
          last_updated_by: userId
        }])
        .select()
        .single();

      if (createError) throw createError;
      res.json({ message: 'Response created successfully', response: newResponse });
    }
  } catch (error) {
    console.error('Update response error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// === Update Form Response Field (for real-time updates) ===
router.patch('/:id/response', authenticateToken, async (req, res) => {
  try {
    const formId = req.params.id;
    const { fieldId, value } = req.body;
    const userId = req.user.userId;

    // Check if user has access to this form
    const hasAccess = await hasFormAccess(formId, userId);
    if (!hasAccess) {
      return res.status(404).json({ error: 'Form not found or access denied' });
    }

    const { data: currentResponse } = await supabase
      .from('form_responses')
      .select('*')
      .eq('form_id', formId)
      .single();

    const updatedData = {
      ...(currentResponse?.response_data || {}),
      [fieldId]: value
    };

    if (currentResponse) {
      const { data: updatedResponse, error: updateError } = await supabase
        .from('form_responses')
        .update({
          response_data: updatedData,
          last_updated_by: userId,
          updated_at: new Date().toISOString()
        })
        .eq('form_id', formId)
        .select()
        .single();

      if (updateError) throw updateError;
      res.json({ message: 'Response updated successfully', response: updatedResponse });
    } else {
      const { data: newResponse, error: createError } = await supabase
        .from('form_responses')
        .insert([{
          form_id: formId,
          response_data: updatedData,
          last_updated_by: userId
        }])
        .select()
        .single();

      if (createError) throw createError;
      res.json({ message: 'Response created successfully', response: newResponse });
    }
  } catch (error) {
    console.error('Update response error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// === Delete Form ===
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const formId = req.params.id;
    const userId = req.user.userId;

    const { data: form } = await supabase
      .from('forms')
      .select('*')
      .eq('id', formId)
      .eq('created_by', userId)
      .single();

    if (!form) return res.status(404).json({ error: 'Form not found or access denied' });

    const { error: deleteError } = await supabase
      .from('forms')
      .delete()
      .eq('id', formId);
    if (deleteError) throw deleteError;

    res.json({ message: 'Form deleted successfully' });
  } catch (error) {
    console.error('Delete form error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;    