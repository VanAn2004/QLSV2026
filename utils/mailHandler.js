const nodemailer = require("nodemailer");


const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
module.exports = {
    sendMail: async function (to, url) {
        const info = await transporter.sendMail({
            from: process.env.MAIL_FROM,
            to: to,
            subject: "reset password URL",
            text: "click vao day de doi pass",
            html: "click vao <a href=" + url + ">day</a> de doi pass",
        });

        console.log("Message sent:", info.messageId);
    }
}
