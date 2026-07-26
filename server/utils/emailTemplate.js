export const renderEmail = ({ greetingName, bodyHtml, closingLine = 'Enjoy the show! 🍿' }) => `
  <div style='font-family: Arial, sans-serif; line-height: 1.5; padding: 20px;'>
    <h2>Hi ${greetingName},</h2>
    ${bodyHtml}
    <p>${closingLine}</p>
    <p>— MovieTix Team</p>
  </div>
`;

export const highlight = (text) => `<strong style='color:#F84565;'>${text}</strong>`;
