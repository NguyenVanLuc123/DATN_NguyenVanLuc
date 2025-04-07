// src/utils/notifications.js
export const showSuccess = (message) => {
    console.log('Success:', message);
    // Tích hợp thư viện thông báo nếu cần, ví dụ: toast.success(message);
  };
  
  export const showError = (message) => {
    console.error('Error:', message);
    // Tích hợp thư viện thông báo nếu cần, ví dụ: toast.error(message);
  };
  