const database = require('../../../Config/DataBase');

module.exports.register = async (req, res) => {
    const { name, email, phone, password, confirmPassword, is_owner } = req.body;
    console.log(req.body);

    // Kiểm tra nếu email đã tồn tại
    const checkEmailCustomer = 'SELECT * FROM customer WHERE email = ?';
    const emailCheckCustomer = await database.connectDatabase(checkEmailCustomer, [email]);
    const checkEmailOwner = 'SELECT * FROM owner WHERE email = ?';
    const emailCheckowner = await database.connectDatabase(checkEmailOwner, [email]);

    if (emailCheckCustomer.length > 0||emailCheckowner.length > 0) {
        // Nếu email đã tồn tại
        return res.status(400).json({
            success: false,
            message: "Email đã tồn tại",
        });
    }

    // Nếu email chưa tồn tại, tiếp tục chèn dữ liệu vào bảng user
    const query = `
        INSERT INTO user (username, password, is_active, is_owner, date_joined) 
        VALUES (?, ?, ?, ?, NOW())
    `;
    const values = [name, password, 1, parseInt(is_owner)];

    const userResult = await database.connectDatabase(query, values);
    const userId = userResult.insertId;

   
    if (parseInt(is_owner) == 0) {
        const customerQuery = `
            INSERT INTO customer (name, email, phone_number, user_id, balance) 
            VALUES (?, ?, ?, ?, 0)
        `;
        const customerValues = [name, email, phone, userId];
        await database.connectDatabase(customerQuery, customerValues);
    } else {
        const ownerQuery = `
            INSERT INTO owner (name, email, phone_number, user_id, balance) 
            VALUES (?, ?, ?, ?, 0)
        `;
        const ownerValues = [name, email, phone, userId];
        await database.connectDatabase(ownerQuery, ownerValues);
    }


    res.status(201).json({
        success: true,
        message: "Đăng ký thành công",
        data: {
            user_id: userId,
            name: name,
            email: email,
            phone: phone,
            is_owner: is_owner,
            date_joined: new Date().toISOString(), 
        }
    });
};
