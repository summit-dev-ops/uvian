from jinja2 import Template

TRANSCRIPT_TEMPLATE = Template("""
<conversation_history>
{% for msg in db_messages %}
  <message sender="{{ msg.profile.display_name }}" type="{{ msg.profile.type }}" time="{{ msg.created_at }}">
    {{ msg.content }}
  </message>
{% endfor %}
</conversation_history>
""")