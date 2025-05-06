// helper/generateBookingid.js
async function generateBookingId() {
  // dynamic import để lấy ES module
  const { customAlphabet } = await import('nanoid');
  const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);

  const now = new Date();
  const YYYY = now.getFullYear();
  const MM   = String(now.getMonth() + 1).padStart(2, '0');
  const DD   = String(now.getDate()).padStart(2, '0');
  return `${YYYY}${MM}${DD}${nanoid()}`;
}

module.exports = { generateBookingId };