-- Example data for MCP configuration
-- Run after 0072_add_mcps_usage_guidance_and_auto_load_events.sql
-- Adjust MCP IDs and names to match your existing data

-- Set Discord as default MCP (always load)
UPDATE core_automation.agent_mcps 
SET is_default = true 
WHERE mcp_id = (SELECT id FROM core_automation.mcps WHERE name ILIKE '%discord%' LIMIT 1);

-- Set auto_load_events for Discord MCP
UPDATE core_automation.mcps 
SET auto_load_events = ARRAY['com.uvian.discord.message_created', 'com.uvian.discord.interaction_received']
WHERE name ILIKE '%discord%';

-- Set usage_guidance for Discord MCP
UPDATE core_automation.mcps 
SET usage_guidance = 'Discord server management. Use for all Discord interactions: sending messages to channels or DMs, reading channel history, getting user/guild/channel/thread info, and viewing reactions.'
WHERE name ILIKE '%discord%';

-- Set auto_load_events for Uvian Hub MCP
UPDATE core_automation.mcps 
SET auto_load_events = ARRAY['com.uvian.message.created', 'com.uvian.conversation.member_joined', 'com.uvian.ticket.created', 'com.uvian.ticket.updated', 'com.uvian.post.created', 'com.uvian.note.updated', 'com.uvian.asset.uploaded']
WHERE name ILIKE '%hub%';

-- Set usage_guidance for Uvian Hub MCP
UPDATE core_automation.mcps 
SET usage_guidance = 'Core Uvian platform operations. Use for managing messages, conversations, tickets, posts, notes, assets, spaces, and jobs within the Uvian platform.'
WHERE name ILIKE '%hub%';

-- Set auto_load_events for Uvian Scheduler MCP
UPDATE core_automation.mcps 
SET auto_load_events = ARRAY['com.uvian.schedule.schedule_fired']
WHERE name ILIKE '%scheduler%';

-- Set usage_guidance for Uvian Scheduler MCP
UPDATE core_automation.mcps 
SET usage_guidance = 'Scheduled task management. Use when the user wants reminders, scheduled messages, delayed tasks, or anything that should happen at a specific time in the future.'
WHERE name ILIKE '%scheduler%';

-- Set auto_load_events for Uvian Automation MCP
UPDATE core_automation.mcps 
SET auto_load_events = ARRAY['com.uvian.job.created', 'com.uvian.job.cancelled', 'com.uvian.job.retry']
WHERE name ILIKE '%automation%';

-- Set usage_guidance for Uvian Automation MCP
UPDATE core_automation.mcps 
SET usage_guidance = 'Automation workflow management. Use for managing automation jobs, triggers, and workflow configurations.'
WHERE name ILIKE '%automation%';

-- Set auto_load_events for Tavily MCP
UPDATE core_automation.mcps 
SET auto_load_events = ARRAY['com.uvian.web.search', 'com.uvian.web.extract', 'com.uvian.web.crawl']
WHERE name ILIKE '%tavily%';

-- Set usage_guidance for Tavily MCP
UPDATE core_automation.mcps 
SET usage_guidance = 'Web search and content extraction. Use for searching the web, extracting content from URLs, crawling websites, or researching topics.'
WHERE name ILIKE '%tavily%';