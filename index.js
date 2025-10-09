const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const nodemailer = require('nodemailer');
const app = express()
const cors = require('cors')
const port = process.env.PORT || 3000
require('dotenv').config()

// middleware 
app.use(cors());
app.use(express.json())

// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@smasam.hmi3csj.mongodb.net/?retryWrites=true&w=majority&appName=smasam`;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@smasam.hmi3csj.mongodb.net/?retryWrites=true&w=majority&tls=true`;

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendConfirmationEmail = async (orderData) => {
    try {
        // Check for email in both email and email_1 fields
        const emailField = orderData.email || orderData.email_1;

        if (!orderData || !emailField || typeof emailField !== 'string' || emailField.trim() === '') {
            return { success: false, error: 'No valid email address provided' };
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailField.trim())) {
            return { success: false, error: 'Invalid email format' };
        }        // DEBUG: Log email function input
        console.log('📧 ===== EMAIL FUNCTION DEBUG =====');
        console.log('📦 Order data received:', JSON.stringify(orderData, null, 2));
        console.log('📧 Email field (email):', orderData.email);
        console.log('📧 Email field (email_1):', orderData.email_1);
        console.log('💳 Payment method (Betalingsmetode):', orderData.Betalingsmetode);
        console.log('🆔 Order number:', orderData.orderNumber);
        console.log('💰 Total price:', orderData.totalPrice);
        console.log('🧮 Calculation 1:', orderData.calculation_1);
        console.log('🧮 Calculation 3:', orderData.calculation_3);

        // Log ALL fields that contain 'calculation'
        console.log('🔍 All calculation fields in orderData:');
        Object.keys(orderData).forEach(key => {
            if (key.toLowerCase().includes('calculation')) {
                console.log(`   - ${key}: ${orderData[key]}`);
            }
        });

        // Check payment method to determine email template
        const isMobilePay = orderData.Betalingsmetode === "Mobilbetaling";

        // Check if this is a takeaway order (for items display)
        const isTakeawayOrder = orderData.orderNumber && orderData.orderNumber.includes('/take-');

        // Check if this is lamb or takeaway order (for price display)
        const showPrice = orderData.orderNumber && (
            orderData.orderNumber.includes('/lamb-') ||
            orderData.orderNumber.includes('/take-')
        );

        // Always show calculation fields if they exist, regardless of order type
        const showCalculations = orderData.calculation_1 || orderData.calculation_3;

        console.log('🔍 Template logic:');
        console.log('   - isMobilePay:', isMobilePay);
        console.log('   - isTakeawayOrder:', isTakeawayOrder);
        console.log('   - showPrice:', showPrice);
        console.log('   - showCalculations:', showCalculations);

        // Debug pricing section values before template creation
        console.log('💰 Pricing section debug:');
        console.log('   - showPrice && orderData.totalPrice:', showPrice && orderData.totalPrice);
        console.log('   - orderData.totalPrice:', orderData.totalPrice);
        console.log('   - orderData.calculation_1:', orderData.calculation_1);
        console.log('   - orderData.calculation_3:', orderData.calculation_3);
        console.log('   - Boolean check calculation_1:', !!orderData.calculation_1);
        console.log('   - Boolean check calculation_3:', !!orderData.calculation_3);

        // Create different email content based on payment method
        let emailContent;

        if (isMobilePay) {
            // MobilePay template
            emailContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2c3e50; text-align: center;">SMASAM Restaurant</h2>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                        <p style="font-size: 16px; margin-bottom: 15px;">
                            Your order is confirmed ✅
                        </p>
                        
                        <div style="margin: 20px 0; padding: 15px; background-color: #e9ecef; border-radius: 5px;">
                            <h3 style="margin-top: 0; color: #495057;">Customer Information:</h3>
                            <p style="margin: 5px 0;"><strong>Name:</strong> ${orderData.name_2 || orderData.name || 'N/A'}</p>
                            <p style="margin: 5px 0;"><strong>Phone:</strong> ${orderData.phone_1 || orderData.phone || 'N/A'}</p>
                            <p style="margin: 5px 0;"><strong>Email:</strong> ${orderData.email_1 || orderData.email || 'N/A'}</p>
                            <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${orderData.radio_3 || orderData.Betalingsmetode || 'N/A'}</p>
                        </div>
                        
                        <div style="margin: 20px 0; padding: 15px; background-color: #e9ecef; border-radius: 5px;">
                            <h3 style="margin-top: 0; color: #495057;">Order Details:</h3>
                            <p style="margin: 5px 0;"><strong>Order Number:</strong> ${orderData.orderNumber || 'N/A'}</p>
                            <p style="margin: 5px 0;"><strong>Pickup Time:</strong> ${orderData.radio_4 || orderData['Vælg dit afhentningstidspunkt'] || 'N/A'}</p>
                            <p style="margin: 5px 0;"><strong>Pickup Location:</strong> Munkegårdsvej 21b, 3490 Kvistgaard</p>
                            <p style="margin: 5px 0;"><strong>Service Type:</strong> ${orderData.radio_5 || 'Pickup'}</p>
                        </div>
                        
                        ${showPrice && orderData.totalPrice ? `
                            <div style="margin: 20px 0; padding: 15px; background-color: #d1ecf1; border-radius: 5px;">
                                <h3 style="margin-top: 0; color: #0c5460;">Pricing:</h3>
                                <p style="margin: 5px 0;"><strong>Total Amount:</strong> ${orderData.totalPrice} DKK</p>
                            </div>
                        ` : ''}
                        
                        ${isTakeawayOrder ? (() => {
                    // Show items only for takeaway orders (items with "Stykke" values, excluding "Vælg mellem mulighederne")
                    let itemsHtml = '';
                    Object.keys(orderData).forEach(key => {
                        const value = orderData[key];
                        // Check if VALUE contains "Stykke" AND exclude any selection placeholders
                        if (value &&
                            String(value).includes('Stykke') &&
                            !String(value).toLowerCase().includes('vælg') &&
                            !String(value).toLowerCase().includes('mellem') &&
                            !String(value).toLowerCase().includes('mulighederne')) {
                            itemsHtml += `<p style="font-size: 14px; margin: 5px 0;">• ${key}: ${value}</p>`;
                        }
                    });
                    return itemsHtml ? `
                                <div style="margin: 20px 0; padding: 15px; background-color: #fff3cd; border-radius: 5px;">
                                    <h3 style="margin-top: 0; color: #856404;">Selected Items:</h3>
                                    ${itemsHtml}
                                </div>
                            ` : '';
                })() : ''}
                        
                        <div style="background-color: #e8f4fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="font-size: 16px; color: #2c3e50; margin: 0;">
                                <strong>Please pay via MobilePay: #4 79 60</strong>
                            </p>
                        </div>
                        
                        ${showCalculations ? `
                            <div style="margin: 20px 0; padding: 15px; background-color: #f8d7da; border-radius: 5px;">
                                <h3 style="margin-top: 0; color: #721c24;">Calculation Details:</h3>
                                ${orderData.calculation_1 ? `<p style="margin: 5px 0;"><strong>Calculation 1:</strong> ${orderData.calculation_1}</p>` : ''}
                                ${orderData.calculation_3 ? `<p style="margin: 5px 0;"><strong>Calculation 3:</strong> ${orderData.calculation_3}</p>` : ''}
                            </div>
                        ` : ''}
                        
                        <p style="font-size: 18px; text-align: center; color: #27ae60; margin-top: 20px;">
                            💳 Thank you for your order from SMASAM!
                        </p>
                    </div>
                </div>
            `;
        } else {
            // Cash on pickup template
            emailContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2c3e50; text-align: center;">SMASAM Restaurant</h2>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                        <p style="font-size: 16px; margin-bottom: 15px;">
                            Your order is confirmed ✅
                        </p>
                        
                        <div style="margin: 20px 0; padding: 15px; background-color: #e9ecef; border-radius: 5px;">
                            <h3 style="margin-top: 0; color: #495057;">Customer Information:</h3>
                            <p style="margin: 5px 0;"><strong>Name:</strong> ${orderData.name_2 || orderData.name || 'N/A'}</p>
                            <p style="margin: 5px 0;"><strong>Phone:</strong> ${orderData.phone_1 || orderData.phone || 'N/A'}</p>
                            <p style="margin: 5px 0;"><strong>Email:</strong> ${orderData.email_1 || orderData.email || 'N/A'}</p>
                            <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${orderData.radio_3 || orderData.Betalingsmetode || 'N/A'}</p>
                        </div>
                        
                        <div style="margin: 20px 0; padding: 15px; background-color: #e9ecef; border-radius: 5px;">
                            <h3 style="margin-top: 0; color: #495057;">Order Details:</h3>
                            <p style="margin: 5px 0;"><strong>Order Number:</strong> ${orderData.orderNumber || 'N/A'}</p>
                            <p style="margin: 5px 0;"><strong>Pickup Time:</strong> ${orderData.radio_4 || orderData['Vælg dit afhentningstidspunkt|radio-4'] || 'N/A'}</p>
                            <p style="margin: 5px 0;"><strong>Pickup Location:</strong> Munkegårdsvej 21b, 3490 Kvistgaard</p>
                            <p style="margin: 5px 0;"><strong>Service Type:</strong> ${orderData.radio_5 || 'Pickup'}</p>
                        </div>
                        
                        ${showPrice && orderData.totalPrice ? `
                            <div style="margin: 20px 0; padding: 15px; background-color: #d1ecf1; border-radius: 5px;">
                                <h3 style="margin-top: 0; color: #0c5460;">Pricing:</h3>
                                <p style="margin: 5px 0;"><strong>Total Amount:</strong> ${orderData.totalPrice} DKK</p>
                            </div>
                        ` : ''}
                        
                        ${isTakeawayOrder ? (() => {
                    // Show items only for takeaway orders (items with "Stykke" values, excluding "Vælg mellan mulighederne")
                    let itemsHtml = '';
                    Object.keys(orderData).forEach(key => {
                        const value = orderData[key];
                        // Check if VALUE contains "Stykke" AND exclude any selection placeholders
                        if (value &&
                            String(value).includes('Stykke') &&
                            !String(value).toLowerCase().includes('vælg') &&
                            !String(value).toLowerCase().includes('mellem') &&
                            !String(value).toLowerCase().includes('mulighederne')) {
                            itemsHtml += `<p style="font-size: 14px; margin: 5px 0;">• ${key}: ${value}</p>`;
                        }
                    });
                    return itemsHtml ? `
                                <div style="margin: 20px 0; padding: 15px; background-color: #fff3cd; border-radius: 5px;">
                                    <h3 style="margin-top: 0; color: #856404;">Selected Items:</h3>
                                    ${itemsHtml}
                                </div>
                            ` : '';
                })() : ''}
                        
                        <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="font-size: 16px; color: #856404; margin: 0;">
                                <strong>You can pay directly upon pickup 💵</strong>
                            </p>
                        </div>
                        
                        ${showCalculations ? `
                            <div style="margin: 20px 0; padding: 15px; background-color: #f8d7da; border-radius: 5px;">
                                <h3 style="margin-top: 0; color: #721c24;">Calculation Details:</h3>
                                ${orderData.calculation_1 ? `<p style="margin: 5px 0;"><strong>Total Payable:</strong> ${orderData.calculation_1}</p>` : ''}
                                ${orderData.calculation_3 ? `<p style="margin: 5px 0;"><strong>Total(before discount):</strong> ${orderData.calculation_3}</p>` : ''}
                            </div>
                        ` : ''}
                        
                        <p style="font-size: 16px; margin-bottom: 15px;">
                            <strong>ORDER NUMBER:</strong> ${orderData.orderNumber || orderData['ORDER NUMBER'] || 'N/A'}
                        </p>
                        
                        <p style="font-size: 18px; text-align: center; color: #27ae60; margin-top: 20px;">
                            💳 Thank you for your order from smasam!
                        </p>
                    </div>
                </div>
            `;
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: emailField.trim(),
            subject: `Order Confirmed - ${orderData.orderNumber}`,
            html: emailContent
        };

        // DEBUG: Log email content being sent
        console.log('📧 ===== EMAIL CONTENT DEBUG =====');
        console.log('📬 To:', emailField.trim());
        console.log('📝 Subject:', `Order Confirmed - ${orderData.orderNumber}`);
        console.log('📄 HTML Content:', emailContent);
        console.log('==================================');

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully! Message ID:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending confirmation email:', error);
        return { success: false, error: error.message };
    }
};

const sendDeliveryEmail = async (orderData) => {
    try {
        // Check for email in both possible fields
        const emailField = orderData.email || orderData.email_1;

        if (!orderData || !emailField || typeof emailField !== 'string' || emailField.trim() === '') {
            return { success: false, error: 'No valid email address provided' };
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailField.trim())) {
            return { success: false, error: 'Invalid email format' };
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: emailField.trim(),
            subject: `Order Delivered - ${orderData.orderNumber}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #27ae60;">Order Delivered - Smasam Restaurant</h2>
                    
                    <p>Dear ${orderData.name || 'Valued Customer'},</p>
                    
                    <p>Great news! Your order has been successfully delivered.</p>
                    
                    <div style="background-color: #d5f4e6; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="color: #27ae60; margin-top: 0;">Delivery Confirmation:</h3>
                        <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
                        <p><strong>Status:</strong> Delivered</p>
                        
                        ${orderData.selectedItems ? `
                            <h4>Items Delivered:</h4>
                            <ul>
                                ${orderData.selectedItems.map(item =>
                `<li>${item.name} - Quantity: ${item.quantity} - £${item.price}</li>`
            ).join('')}
                            </ul>
                            <p><strong>Total Amount:</strong> £${orderData.totalPrice || 'N/A'}</p>
                        ` : ''}
                    </div>
                    
                    <p>We hope you enjoy your meal! Thank you for choosing Smasam Restaurant.</p>
                    
                    <p>Please feel free to contact us if you have any questions or feedback.</p>
                    
                    <hr style="margin: 30px 0;">
                    <p style="color: #7f8c8d; font-size: 12px;">
                        This is an automated message. Please do not reply to this email.
                    </p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending delivery email:', error);
        return { success: false, error: error.message };
    }
};

// console.log(process.env.DB_USER)
// console.log(process.env.DB_PASS)

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        const usersCollection = client.db('smasam_backend').collection('users')
        const afghanCollection = client.db('smasam_backend').collection('afghan')
        const persianCollection = client.db('smasam_backend').collection('persiann')
        const indianCollection = client.db('smasam_backend').collection('indian')
        const lambCollection = client.db('smasam_backend').collection('lamb')
        const takeAwayCollection = client.db('smasam_backend').collection('takeAway')
        const lunchCollection = client.db('smasam_backend').collection('lunch')



        // app.post('/marathons', async (req, res) => {
        //     const data = req.body;
        //     console.log(data)
        //     const result = await marathonCollection.insertOne(data)
        //     res.send(result)
        // })

        // Afghan Menu, Persian Menu, Indian Menu, Roasted Lamb, Takeaway Menu, Lunch Menu, Contact Form



        // post api  for 6 menu///

        // post api for aghan 
        app.post("/afghan", async (req, res) => {
            const data = req.body;
            // count total orders to generate unique order number
            const count = await afghanCollection.countDocuments();
            // add extra fields before inserting
            const newOrder = {
                ...data,
                orderNumber: `smasam/afghan-${(count + 1).toString().padStart(3, "0")}`,
                orderStatus: "Pending",
                lastUpdate: "Not Delivered",
                // sendin mail through n8n 
                isDeliveredMsg: false,
                isConfirmMsg: false,
                createdAt: new Date(),
            };
            const result = await afghanCollection.insertOne(newOrder);
            res.send(result);
        });

        // get afghan data
        app.get('/afghan', async (req, res) => {
            const result = await afghanCollection.find().toArray();
            res.send(result);
        });

        //change value in afghan data 
        app.put("/afghan/:id", async (req, res) => {
            try {
                const id = req.params.id;
                const updateData = req.body;

                console.log('🔄 ===== AFGHAN PUT REQUEST DEBUG =====');
                console.log('📝 Order ID:', id);
                console.log('📦 Update data received:', JSON.stringify(updateData, null, 2));
                console.log('🔍 Available fields in update:', Object.keys(updateData));
                console.log('=======================================');

                // Get the current order data before updating
                const currentOrder = await afghanCollection.findOne({ _id: new ObjectId(id) });

                if (!currentOrder) {
                    console.log('❌ Afghan order not found:', id);
                    return res.status(404).send({ success: false, message: "Order not found" });
                }

                console.log('📄 Current order before update:', JSON.stringify(currentOrder, null, 2));

                // Check if order status is being changed from "Pending" to "Confirmed" or "Confirm"
                const isStatusChangingToConfirmed =
                    currentOrder.orderStatus === "Pending" &&
                    (updateData.orderStatus === "Confirmed" || updateData.orderStatus === "Confirm");

                // Check if lastUpdate is being changed to "Delivered"
                const isStatusChangingToDelivered =
                    currentOrder.lastUpdate !== "Delivered" &&
                    updateData.lastUpdate === "Delivered";

                console.log('🔍 Status change detection:');
                console.log('   - Current status:', currentOrder.orderStatus);
                console.log('   - New status:', updateData.orderStatus);
                console.log('   - Will send confirmation email:', isStatusChangingToConfirmed);
                console.log('   - Current lastUpdate:', currentOrder.lastUpdate);
                console.log('   - New lastUpdate:', updateData.lastUpdate);
                console.log('   - Will send delivery email:', isStatusChangingToDelivered);

                const result = await afghanCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updateData }
                );

                if (result.modifiedCount > 0) {
                    const updatedOrder = { ...currentOrder, ...updateData };
                    let emailResults = [];

                    // If status changed to confirmed, send confirmation email
                    if (isStatusChangingToConfirmed) {
                        const emailResult = await sendConfirmationEmail(updatedOrder);
                        emailResults.push({ type: 'confirmation', ...emailResult });

                        if (emailResult.success) {
                            // Update the isConfirmMsg flag
                            await afghanCollection.updateOne(
                                { _id: new ObjectId(id) },
                                { $set: { isConfirmMsg: true } }
                            );
                        }
                    }

                    // If status changed to delivered, send delivery email
                    if (isStatusChangingToDelivered) {
                        const emailResult = await sendDeliveryEmail(updatedOrder);
                        emailResults.push({ type: 'delivery', ...emailResult });

                        if (emailResult.success) {
                            // Update the isDeliveredMsg flag
                            await afghanCollection.updateOne(
                                { _id: new ObjectId(id) },
                                { $set: { isDeliveredMsg: true } }
                            );
                        }
                    }

                    res.send({
                        success: true,
                        message: "Order updated successfully",
                        emailResults: emailResults
                    });
                } else {
                    res.status(404).send({ success: false, message: "Order not found" });
                }
            } catch (error) {
                console.error("Error updating order:", error);
                res.status(500).send({ success: false, message: "Internal Server Error" });
            }
        });
        // afghan  end ------------------------------------------

        // post api for persian 
        app.post("/persian", async (req, res) => {
            const data = req.body;
            // count total orders to generate unique order number
            const count = await persianCollection.countDocuments();
            // add extra fields before inserting
            const newOrder = {
                ...data,
                orderNumber: `smasam/persian-${(count + 1).toString().padStart(3, "0")}`,
                orderStatus: "Pending",
                lastUpdate: "Not Delivered",
                isDeliveredMsg: false,
                isConfirmMsg: false,
            };
            const result = await persianCollection.insertOne(newOrder);
            res.send(result);
        });

        // get persian data
        app.get('/persian', async (req, res) => {
            const result = await persianCollection.find().toArray();
            res.send(result);
        });



        // put request for persian menu 
        app.put("/persian/:id", async (req, res) => {
            try {
                const id = req.params.id;
                const updateData = req.body;

                console.log('🔄 ===== PERSIAN PUT REQUEST DEBUG =====');
                console.log('📝 Order ID:', id);
                console.log('📦 Update data received:', JSON.stringify(updateData, null, 2));
                console.log('🔍 Available fields in update:', Object.keys(updateData));
                console.log('========================================');

                // Get the current order data before updating
                const currentOrder = await persianCollection.findOne({ _id: new ObjectId(id) });

                if (!currentOrder) {
                    console.log('❌ Persian order not found:', id);
                    return res.status(404).send({ success: false, message: "Order not found" });
                }

                console.log('📄 Current order before update:', JSON.stringify(currentOrder, null, 2));

                console.log('📄 Current order before update:', JSON.stringify(currentOrder, null, 2));

                // Check if order status is being changed from "Pending" to "Confirmed" or "Confirm"
                const isStatusChangingToConfirmed =
                    currentOrder.orderStatus === "Pending" &&
                    (updateData.orderStatus === "Confirmed" || updateData.orderStatus === "Confirm");

                // Check if lastUpdate is being changed to "Delivered"
                const isStatusChangingToDelivered =
                    currentOrder.lastUpdate !== "Delivered" &&
                    updateData.lastUpdate === "Delivered";

                console.log('🔍 Status change detection:');
                console.log('   - Current status:', currentOrder.orderStatus);
                console.log('   - New status:', updateData.orderStatus);
                console.log('   - Will send confirmation email:', isStatusChangingToConfirmed);
                console.log('   - Current lastUpdate:', currentOrder.lastUpdate);
                console.log('   - New lastUpdate:', updateData.lastUpdate);
                console.log('   - Will send delivery email:', isStatusChangingToDelivered);


                const result = await persianCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updateData }
                );

                if (result.modifiedCount > 0) {
                    const updatedOrder = { ...currentOrder, ...updateData };
                    let emailResults = [];

                    // If status changed to confirmed, send confirmation email
                    if (isStatusChangingToConfirmed) {
                        const emailResult = await sendConfirmationEmail(updatedOrder);
                        emailResults.push({ type: 'confirmation', ...emailResult });

                        if (emailResult.success) {
                            // Update the isConfirmMsg flag
                            await persianCollection.updateOne(
                                { _id: new ObjectId(id) },
                                { $set: { isConfirmMsg: true } }
                            );
                        }
                    }

                    // If status changed to delivered, send delivery email
                    if (isStatusChangingToDelivered) {
                        const emailResult = await sendDeliveryEmail(updatedOrder);
                        emailResults.push({ type: 'delivery', ...emailResult });

                        if (emailResult.success) {
                            // Update the isDeliveredMsg flag
                            await persianCollection.updateOne(
                                { _id: new ObjectId(id) },
                                { $set: { isDeliveredMsg: true } }
                            );
                        }
                    }

                    res.send({
                        success: true,
                        message: "Order updated successfully",
                        emailResults: emailResults
                    });
                } else {
                    res.status(404).send({ success: false, message: "Order not found" });
                }
            } catch (error) {
                console.error("Error updating order:", error);
                res.status(500).send({ success: false, message: "Internal Server Error" });
            }
        });






        //persian  end-----------------------




        // post api for indian menu 
        app.post("/indian", async (req, res) => {
            const data = req.body;
            console.log(data)
            // count total orders to generate unique order number
            const count = await indianCollection.countDocuments();
            // add extra fields before inserting
            const newOrder = {
                ...data,
                orderNumber: `smasam/indian-${(count + 1).toString().padStart(3, "0")}`,
                orderStatus: "Pending",
                lastUpdate: "Not Delivered",
                isDeliveredMsg: false,
                isConfirmMsg: false,
                createdAt: new Date(),
            };
            const result = await indianCollection.insertOne(newOrder);
            res.send(result);
        });


        // get indian data
        app.get('/indian', async (req, res) => {
            const result = await indianCollection.find().toArray();
            res.send(result);
        });

        // put request for indian menu 
        app.put("/indian/:id", async (req, res) => {
            try {
                const id = req.params.id;
                const updateData = req.body;

                console.log('🔄 ===== INDIAN PUT REQUEST DEBUG =====');
                console.log('📝 Order ID:', id);
                console.log('📦 Update data received:', JSON.stringify(updateData, null, 2));
                console.log('🔍 Available fields in update:', Object.keys(updateData));
                console.log('=======================================');

                // Get the current order data before updating
                const currentOrder = await indianCollection.findOne({ _id: new ObjectId(id) });

                if (!currentOrder) {
                    console.log('❌ Indian order not found:', id);
                    return res.status(404).send({ success: false, message: "Order not found" });
                }

                console.log('📄 Current order before update:', JSON.stringify(currentOrder, null, 2));

                console.log('📄 Current order before update:', JSON.stringify(currentOrder, null, 2));

                // Check if order status is being changed from "Pending" to "Confirmed" or "Confirm"
                const isStatusChangingToConfirmed =
                    currentOrder.orderStatus === "Pending" &&
                    (updateData.orderStatus === "Confirmed" || updateData.orderStatus === "Confirm");

                // Check if lastUpdate is being changed to "Delivered"
                const isStatusChangingToDelivered =
                    currentOrder.lastUpdate !== "Delivered" &&
                    updateData.lastUpdate === "Delivered";

                console.log('🔍 Status change detection:');
                console.log('   - Current status:', currentOrder.orderStatus);
                console.log('   - New status:', updateData.orderStatus);
                console.log('   - Will send confirmation email:', isStatusChangingToConfirmed);
                console.log('   - Current lastUpdate:', currentOrder.lastUpdate);
                console.log('   - New lastUpdate:', updateData.lastUpdate);
                console.log('   - Will send delivery email:', isStatusChangingToDelivered);

                const result = await indianCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updateData }
                );

                if (result.modifiedCount > 0) {
                    const updatedOrder = { ...currentOrder, ...updateData };
                    let emailResults = [];

                    // If status changed to confirmed, send confirmation email
                    if (isStatusChangingToConfirmed) {
                        const emailResult = await sendConfirmationEmail(updatedOrder);
                        emailResults.push({ type: 'confirmation', ...emailResult });

                        if (emailResult.success) {
                            // Update the isConfirmMsg flag
                            await indianCollection.updateOne(
                                { _id: new ObjectId(id) },
                                { $set: { isConfirmMsg: true } }
                            );
                        }
                    }

                    // If status changed to delivered, send delivery email
                    if (isStatusChangingToDelivered) {
                        const emailResult = await sendDeliveryEmail(updatedOrder);
                        emailResults.push({ type: 'delivery', ...emailResult });

                        if (emailResult.success) {
                            // Update the isDeliveredMsg flag
                            await indianCollection.updateOne(
                                { _id: new ObjectId(id) },
                                { $set: { isDeliveredMsg: true } }
                            );
                        }
                    }

                    res.send({
                        success: true,
                        message: "Order updated successfully",
                        emailResults: emailResults
                    });
                } else {
                    res.status(404).send({ success: false, message: "Order not found" });
                }
            } catch (error) {
                console.error("Error updating order:", error);
                res.status(500).send({ success: false, message: "Internal Server Error" });
            }
        });

        ///indian end ---------------------------

        //post api for lamb
        app.post("/lamb", async (req, res) => {
            const data = req.body;
            console.log(data)
            // count total orders to generate unique order number
            const count = await lambCollection.countDocuments();
            // add extra fields before inserting
            const newOrder = {
                ...data,
                orderNumber: `smasam/lamb-${(count + 1).toString().padStart(3, "0")}`,
                orderStatus: "Pending",
                lastUpdate: "Not Delivered",
                createdAt: new Date(),
                isDeliveredMsg: false,
                isConfirmMsg: false,
            };
            const result = await lambCollection.insertOne(newOrder);
            res.send(result);
        });

        // get lamb data
        app.get('/lamb', async (req, res) => {
            const result = await lambCollection.find().toArray();
            res.send(result);
        });


        app.put("/lamb/:id", async (req, res) => {
            try {
                const id = req.params.id;
                const updateData = req.body;

                console.log('🔄 ===== LAMB PUT REQUEST DEBUG =====');
                console.log('📝 Order ID:', id);
                console.log('📦 Update data received:', JSON.stringify(updateData, null, 2));
                console.log('🔍 Available fields in update:', Object.keys(updateData));
                console.log('=====================================');

                // Get the current order data before updating
                const currentOrder = await lambCollection.findOne({ _id: new ObjectId(id) });

                if (!currentOrder) {
                    console.log('❌ Lamb order not found:', id);
                    return res.status(404).send({ success: false, message: "Order not found" });
                }

                console.log('📄 Current order before update:', JSON.stringify(currentOrder, null, 2));

                console.log('📄 Current order before update:', JSON.stringify(currentOrder, null, 2));

                // Check if order status is being changed from "Pending" to "Confirmed" or "Confirm"
                const isStatusChangingToConfirmed =
                    currentOrder.orderStatus === "Pending" &&
                    (updateData.orderStatus === "Confirmed" || updateData.orderStatus === "Confirm");

                // Check if lastUpdate is being changed to "Delivered"
                const isStatusChangingToDelivered =
                    currentOrder.lastUpdate !== "Delivered" &&
                    updateData.lastUpdate === "Delivered";

                console.log('🔍 Status change detection:');
                console.log('   - Current status:', currentOrder.orderStatus);
                console.log('   - New status:', updateData.orderStatus);
                console.log('   - Will send confirmation email:', isStatusChangingToConfirmed);
                console.log('   - Current lastUpdate:', currentOrder.lastUpdate);
                console.log('   - New lastUpdate:', updateData.lastUpdate);
                console.log('   - Will send delivery email:', isStatusChangingToDelivered);

                const result = await lambCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updateData }
                );

                if (result.modifiedCount > 0) {
                    const updatedOrder = { ...currentOrder, ...updateData };
                    let emailResults = [];

                    // If status changed to confirmed, send confirmation email
                    if (isStatusChangingToConfirmed) {
                        const emailResult = await sendConfirmationEmail(updatedOrder);
                        emailResults.push({ type: 'confirmation', ...emailResult });

                        if (emailResult.success) {
                            // Update the isConfirmMsg flag
                            await lambCollection.updateOne(
                                { _id: new ObjectId(id) },
                                { $set: { isConfirmMsg: true } }
                            );
                        }
                    }

                    // If status changed to delivered, send delivery email
                    if (isStatusChangingToDelivered) {
                        const emailResult = await sendDeliveryEmail(updatedOrder);
                        emailResults.push({ type: 'delivery', ...emailResult });

                        if (emailResult.success) {
                            // Update the isDeliveredMsg flag
                            await lambCollection.updateOne(
                                { _id: new ObjectId(id) },
                                { $set: { isDeliveredMsg: true } }
                            );
                        }
                    }

                    res.send({
                        success: true,
                        message: "Order updated successfully",
                        emailResults: emailResults
                    });
                } else {
                    res.status(404).send({ success: false, message: "Order not found" });
                }
            } catch (error) {
                console.error("Error updating order:", error);
                res.status(500).send({ success: false, message: "Internal Server Error" });
            }
        });
        // lamb end ---------------------------

        // takeaway start ----------------------------------
        //post api for takeAway
        app.post("/takeAway", async (req, res) => {
            const data = req.body;
            console.log(data)
            // count total orders to generate unique order number
            const count = await takeAwayCollection.countDocuments();
            // add extra fields before inserting
            const newOrder = {
                ...data,
                orderNumber: `smasam/take-${(count + 1).toString().padStart(3, "0")}`,
                orderStatus: "Pending",
                lastUpdate: "Not Delivered",
                isDeliveredMsg: false,
                isConfirmMsg: false,
            };
            const result = await takeAwayCollection.insertOne(newOrder);
            res.send(result);
        });


        // get takeaway data
        app.get('/takeAway', async (req, res) => {
            const result = await takeAwayCollection.find().toArray();
            res.send(result);
        });


        app.put("/takeaway/:id", async (req, res) => {
            try {
                const id = req.params.id;
                const updateData = req.body;

                console.log('🔄 ===== TAKEAWAY PUT REQUEST DEBUG =====');
                console.log('📝 Order ID:', id);
                console.log('📦 Update data received:', JSON.stringify(updateData, null, 2));
                console.log('🔍 Available fields in update:', Object.keys(updateData));
                console.log('=========================================');

                // Get the current order data before updating
                const currentOrder = await takeAwayCollection.findOne({ _id: new ObjectId(id) });

                if (!currentOrder) {
                    console.log('❌ Takeaway order not found:', id);
                    return res.status(404).send({ success: false, message: "Order not found" });
                }

                console.log('📄 Current order found:', JSON.stringify(currentOrder, null, 2));

                // Check if order status is being changed from "Pending" to "Confirmed" or "Confirm"
                const isStatusChangingToConfirmed =
                    currentOrder.orderStatus === "Pending" &&
                    (updateData.orderStatus === "Confirmed" || updateData.orderStatus === "Confirm");

                // Check if lastUpdate is being changed to "Delivered"
                const isStatusChangingToDelivered =
                    currentOrder.lastUpdate !== "Delivered" &&
                    updateData.lastUpdate === "Delivered";

                console.log('🔍 Status change detection:');
                console.log('   - Current status:', currentOrder.orderStatus);
                console.log('   - New status:', updateData.orderStatus);
                console.log('   - Will send confirmation email:', isStatusChangingToConfirmed);
                console.log('   - Current lastUpdate:', currentOrder.lastUpdate);
                console.log('   - New lastUpdate:', updateData.lastUpdate);
                console.log('   - Will send delivery email:', isStatusChangingToDelivered);

                const result = await takeAwayCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updateData }
                );

                if (result.modifiedCount > 0) {
                    const updatedOrder = { ...currentOrder, ...updateData };
                    let emailResults = [];

                    // If status changed to confirmed, send confirmation email
                    if (isStatusChangingToConfirmed) {
                        const emailResult = await sendConfirmationEmail(updatedOrder);
                        emailResults.push({ type: 'confirmation', ...emailResult });

                        if (emailResult.success) {
                            // Update the isConfirmMsg flag
                            await takeAwayCollection.updateOne(
                                { _id: new ObjectId(id) },
                                { $set: { isConfirmMsg: true } }
                            );
                        }
                    }

                    // If status changed to delivered, send delivery email
                    if (isStatusChangingToDelivered) {
                        const emailResult = await sendDeliveryEmail(updatedOrder);
                        emailResults.push({ type: 'delivery', ...emailResult });

                        if (emailResult.success) {
                            // Update the isDeliveredMsg flag
                            await takeAwayCollection.updateOne(
                                { _id: new ObjectId(id) },
                                { $set: { isDeliveredMsg: true } }
                            );
                        }
                    }

                    res.send({
                        success: true,
                        message: "Order updated successfully",
                        emailResults: emailResults
                    });
                } else {
                    res.status(404).send({ success: false, message: "Order not found" });
                }
            } catch (error) {
                console.error("Error updating order:", error);
                res.status(500).send({ success: false, message: "Internal Server Error" });
            }
        });


        // takeaway end ---------------------------


        // lunch start 

        //post api for lunch
        app.post("/lunch", async (req, res) => {
            const data = req.body;
            console.log(data)
            // count total orders to generate unique order number
            const count = await lunchCollection.countDocuments();
            // add extra fields before inserting
            const newOrder = {
                ...data,
                orderNumber: `smasam/lunch-${(count + 1).toString().padStart(3, "0")}`,
                orderStatus: "Pending",
                lastUpdate: "Not Delivered",
                isDeliveredMsg: false,
                isConfirmMsg: false,
            };
            const result = await lunchCollection.insertOne(newOrder);
            res.send(result);
        });


        // get lunch data
        app.get('/lunch', async (req, res) => {
            const result = await lunchCollection.find().toArray();
            res.send(result);
        });

        app.put("/lunch/:id", async (req, res) => {
            try {
                const id = req.params.id;
                const updateData = req.body;

                console.log('🔄 ===== LUNCH PUT REQUEST DEBUG =====');
                console.log('📝 Order ID:', id);
                console.log('📦 Update data received:', JSON.stringify(updateData, null, 2));
                console.log('🔍 Available fields in update:', Object.keys(updateData));
                console.log('======================================');

                // Get the current order data before updating
                const currentOrder = await lunchCollection.findOne({ _id: new ObjectId(id) });

                if (!currentOrder) {
                    console.log('❌ Lunch order not found:', id);
                    return res.status(404).send({ success: false, message: "Order not found" });
                }

                console.log('📄 Current order before update:', JSON.stringify(currentOrder, null, 2));
                console.log('📄 Current order before update:', JSON.stringify(currentOrder, null, 2));

                // Check if order status is being changed from "Pending" to "Confirmed" or "Confirm"
                const isStatusChangingToConfirmed =
                    currentOrder.orderStatus === "Pending" &&
                    (updateData.orderStatus === "Confirmed" || updateData.orderStatus === "Confirm");

                // Check if lastUpdate is being changed to "Delivered"
                const isStatusChangingToDelivered =
                    currentOrder.lastUpdate !== "Delivered" &&
                    updateData.lastUpdate === "Delivered";

                console.log('🔍 Status change detection:');
                console.log('   - Current status:', currentOrder.orderStatus);
                console.log('   - New status:', updateData.orderStatus);
                console.log('   - Will send confirmation email:', isStatusChangingToConfirmed);
                console.log('   - Current lastUpdate:', currentOrder.lastUpdate);
                console.log('   - New lastUpdate:', updateData.lastUpdate);
                console.log('   - Will send delivery email:', isStatusChangingToDelivered);

                const result = await lunchCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updateData }
                );

                if (result.modifiedCount > 0) {
                    const updatedOrder = { ...currentOrder, ...updateData };
                    let emailResults = [];

                    // If status changed to confirmed, send confirmation email
                    if (isStatusChangingToConfirmed) {
                        const emailResult = await sendConfirmationEmail(updatedOrder);
                        emailResults.push({ type: 'confirmation', ...emailResult });

                        if (emailResult.success) {
                            // Update the isConfirmMsg flag
                            await lunchCollection.updateOne(
                                { _id: new ObjectId(id) },
                                { $set: { isConfirmMsg: true } }
                            );
                        }
                    }

                    // If status changed to delivered, send delivery email
                    if (isStatusChangingToDelivered) {
                        const emailResult = await sendDeliveryEmail(updatedOrder);
                        emailResults.push({ type: 'delivery', ...emailResult });

                        if (emailResult.success) {
                            // Update the isDeliveredMsg flag
                            await lunchCollection.updateOne(
                                { _id: new ObjectId(id) },
                                { $set: { isDeliveredMsg: true } }
                            );
                        }
                    }

                    res.send({
                        success: true,
                        message: "Order updated successfully",
                        emailResults: emailResults
                    });
                } else {
                    res.status(404).send({ success: false, message: "Order not found" });
                }
            } catch (error) {
                console.error("Error updating order:", error);
                res.status(500).send({ success: false, message: "Internal Server Error" });
            }
        });



        //get data  endpoit 


















        //testing

        // // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Application is working')
})




app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})


