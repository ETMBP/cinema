export interface IMailTemplate {
  subject: string;
  text: string;
  html: string;
}

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

export function welcomeTemplate(p: { username: string }): IMailTemplate {
  return {
    subject: 'Welcome to ETMBP Entartainment',
    text: `Hi ${p.username},\n\nYour account has been successfully created.\nThank you for joining us, enjoy your stay!\n\nHave a nice day,\nETMBP Entertainment`,
    html: `<h2>Hi ${escapeHtml(p.username)}</h2>
      <br />
      <p>Your account has been successfully created.<br />
      Thank you for joining us, enjoy your stay!</p>
      <p>Have a nice day,<br />
      <strong>ETMBP Entertainment</strong></p>`,
  };
}

export function passwordResetTemplate(p: {
  username: string;
  url: string;
}): IMailTemplate {
  return {
    subject: 'ETMBP Password Reset',
    text: `Hi ${p.username},\n\n
      A password reset has been requested.\n
      You can reset your password with this link: ${p.url}\n\n
      Have a nice day\n,
      ETMBP Entertainment`,
    html: `<h2>Hi ${escapeHtml(p.username)}</h2>
      <br />
      <p>A password reset has been requested.<br />
      You can reset your password with this <a href="${p.url}">link</a></p>
      <p>Have a nice day,<br />
      <strong>ETMBP Entertainment</strong></p>`,
  };
}
