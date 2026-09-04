/* Escape database text; only authored article content may contain safe HTML. */
function escapeText(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function htmlArg(value) { return escapeText(JSON.stringify(String(value ?? ''))); }
function safeMarkup(value) {
  if (!window.DOMPurify) return escapeText(value);
  return DOMPurify.sanitize(String(value || ''), {
    USE_PROFILES:{html:true}, FORBID_TAGS:['form','input','button','textarea','select','style'],
    FORBID_ATTR:['srcdoc'], ADD_ATTR:['target']
  });
}
