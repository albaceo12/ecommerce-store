import transporter from "../lib/emailService";
export const generateEmailContent = (user, order) => {
  // Generate an HTML list of all the products in the order
  const productList = order.products
    .map(
      (item) => `
        <li>
            <img src="${item.product.image}" alt="${
        item.product.name
      }" style="width: 50px; height: 50px; object-fit: cover; margin-right: 10px;">
            <p style="font-size: 14px;">${item.product.name} (x${
        item.quantity
      }) - $${item.price.toFixed(2)}</p>
        </li>
    `
    )
    .join("");

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #28a745;">🎉 Purchase Successful!</h2>
        <p>Dear ${user.name},</p>
        <p>Thank you for your order with us. Your order details are below. We'll send another email when your order has shipped.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px;">
            <h3 style="margin-top: 0; color: #333;">Order #${order._id}</h3>
            <p><strong>Total Amount:</strong> $${order.totalAmount.toFixed(
              2
            )}</p>
            <p><strong>Shipping Method:</strong> ${order.shippingMethodName}</p>
        </div>
        
        <div style="margin-top: 20px;">
            <h3 style="color: #333;">Items in your order:</h3>
            <ul style="list-style: none; padding: 0;">
                ${productList}
            </ul>
        </div>
        
        <p style="margin-top: 20px;">If you have any questions, please contact our support team.</p>
        <p style="text-align: center; color: #888; font-size: 12px;">© Your Store Name</p>
    </div>
    `;
};
// Function to send email (you'll need to implement this)
export const sendOrderConfirmationEmail = async (user, order) => {
  console.log(
    `Sending order confirmation email for order ${order._id} to ${user.email}`
  );
  const mailOptions = {
    from: `"AlbaceoShop" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: `Order Confirmation #${order._id}`,
    html: generateEmailContent(user, order),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Order confirmation email sent to ${user.email}`);
  } catch (error) {
    console.error(`❌ Error sending email to ${user.email}:`, error);
  }
};
