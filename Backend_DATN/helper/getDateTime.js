function getVietnamDateTime() {
  const now = new Date();

  // Lấy thời gian theo múi giờ Việt Nam (UTC+7)
  const vietnamTime = new Date(
    now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })
  );

  const year = vietnamTime.getFullYear();
  const month = String(vietnamTime.getMonth() + 1).padStart(2, '0');
  const day = String(vietnamTime.getDate()).padStart(2, '0');
  const hour = String(vietnamTime.getHours()).padStart(2, '0');
  const minute = String(vietnamTime.getMinutes()).padStart(2, '0');
  const second = String(vietnamTime.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

module.exports = getVietnamDateTime;
