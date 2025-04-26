
const durationISO = (a, b) => {
    // Chuyển đổi chuỗi thành đối tượng Date
    const startDate = new Date(a);
    const endDate = new Date(b);

    // Tính khoảng cách giữa 2 ngày (theo milliseconds)
    const diffInMilliseconds = endDate - startDate;

    // Chuyển đổi milliseconds thành ngày
    const millisecondsInADay = 1000 * 60 * 60 * 24;
    const diffInDays = diffInMilliseconds / millisecondsInADay;

    // Tách phần nguyên và phần thập phân của số ngày
    const fullDays = Math.floor(diffInDays); // Phần nguyên: số ngày đầy đủ
    const remainingMilliseconds = diffInMilliseconds % millisecondsInADay; // Thời gian còn lại trong ngày

    // Tính số giờ còn lại
    const remainingHours = remainingMilliseconds / (1000 * 60 * 60);

    // Nếu thời gian còn lại > 12 giờ, làm tròn lên thành 1 ngày tròn, ngược lại là nửa ngày
    let totalDays;
    if (remainingHours >= 12) {
    totalDays = fullDays + 1; // Làm tròn lên thành 1 ngày tròn
    } else if (remainingHours > 0) {
    totalDays = fullDays + 0.5; // Tính là nửa ngày
    } else {
    totalDays = fullDays; // Không có thời gian thừa
    }

    return fullDays;
}

export default durationISO;