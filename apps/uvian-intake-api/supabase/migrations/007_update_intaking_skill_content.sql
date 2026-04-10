-- Migration: 007_update_intaking_skill_content.sql
-- Update the "Intaking Information" skill with clearer submission handling instructions

UPDATE core_automation.skills 
SET content = '---
overview: The Uvian Intake MCP provides encrypted form creation through intake sessions. Each intake generates a unique shareable link that users can fill out. Submissions are encrypted and can only be decrypted with the corresponding RSA private key.

workflow:
  step_1_generate_keypair:
    tool: generate_rsa_keypair
    description: Generate an RSA keypair for encryption
    args: {}
    notes: Save the private_key securely. You will need it to decrypt submissions later.
  
  step_2_create_intake:
    tool: create_intake
    description: Create the intake form with a title and description
    args:
      title: Clear, descriptive title for the form
      description: Instructions for the person filling out the form
      fields: Optional array of field definitions for structured forms
      public_key: The public key from step 1
    notes: The response includes a tokenId and shareable URL. Send the URL to the user. Save the tokenId - you need it to check submissions!
  
  step_3_share_link:
    tool: discord_send_dm or discord_send_channel
    description: Send the intake URL to the requesting user
    notes: Keep the message concise. Include the form title, brief description, and the link. Stay under Discord''s 2000 character limit.

when_to_use:
  - User asks to create a form, survey, or questionnaire
  - User needs to collect structured information (onboarding, applications, feedback)
  - User wants a shareable link for data collection
  - DO NOT use for simple text responses - use Discord tools directly instead

best_practices:
  - Always generate a fresh keypair for each new intake
  - Store the private_key as a secret via create_secret so you can retrieve it later
  - Write clear, friendly form descriptions so users know what to fill out
  - For multi-section forms, use the fields parameter to define structured inputs
  - If the user asks to view form responses, first use get_submissions_by_intake to get submissions, then use decrypt_submission
  - Never send raw encrypted data to users - always decrypt first
  - Keep Discord messages under 2000 characters - split into multiple messages if needed

managing_submissions:
  retrieve_submissions: Use get_submissions_by_intake with the tokenId (NOT submissionId!) to list all submissions. The response includes submission IDs in the id field.
  decrypt_data: Use decrypt_submission with secretId (from generate_rsa_keypair) and submissionId (from get_submissions_by_intake response array, NOT tokenId!)
  check_status: Use get_intake_status to see if an intake has submissions
  revoke: Use revoke_intake to close a form and stop accepting new submissions

common_mistakes_to_avoid:
  - DO NOT manually type out form templates as Discord messages - use create_intake instead
  - DO NOT load the Uvian Hub MCP when you need forms - use Uvian Intake MCP
  - DO NOT forget to save the private key - without it, submissions cannot be read
  - DO NOT send form content as plain text in Discord when an intake link is more appropriate
  - DO NOT confuse tokenId (intake ID) with submissionId - they are DIFFERENT! TokenId starts with int_, submissionId starts with sub_
  - When calling decrypt_submission, use the submissionId from get_submissions_by_intake response, NOT the tokenId
',
    updated_at = NOW()
WHERE name = 'Intaking Information';
