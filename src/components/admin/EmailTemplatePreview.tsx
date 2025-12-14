import { useState } from "react";
import { Eye, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EmailTemplatePreviewProps {
  firstEmailDiscountCode: string;
  firstEmailDiscountPercent: number;
  secondEmailDiscountCode: string;
  secondEmailDiscountPercent: number;
}

const STORE_NAME = "Desi Pantry";

const sampleCartItems = [
  { productName: "Tata Tea Gold Premium", variantSize: "500g", quantity: 2, price: 245 },
  { productName: "MTR Rava Idli Mix", variantSize: "200g", quantity: 1, price: 85 },
  { productName: "Haldiram's Bhujia", variantSize: "400g", quantity: 3, price: 120 },
];

const sampleCartTotal = sampleCartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

const EmailTemplatePreview = ({
  firstEmailDiscountCode,
  firstEmailDiscountPercent,
  secondEmailDiscountCode,
  secondEmailDiscountPercent,
}: EmailTemplatePreviewProps) => {
  const [open, setOpen] = useState(false);

  const generateEmailHtml = (isSecondEmail: boolean) => {
    const discountCode = isSecondEmail ? secondEmailDiscountCode : firstEmailDiscountCode;
    const discountPercent = isSecondEmail ? secondEmailDiscountPercent : firstEmailDiscountPercent;
    const discountPercentStr = `${discountPercent}%`;

    const headerText = isSecondEmail ? "Last chance to save!" : "Don't forget your items!";
    const subHeaderText = isSecondEmail
      ? `We're giving you an EXTRA ${discountPercentStr} OFF to complete your order`
      : "Your cart is waiting for you";

    const cartItemsHtml = sampleCartItems
      .map(
        (item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">
            <strong>${item.productName}</strong>
            <br><span style="color: #666; font-size: 12px;">Size: ${item.variantSize}</span>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
      `
      )
      .join("");

    const urgencyBanner = isSecondEmail
      ? `
        <div style="background-color: #FF4444; color: white; padding: 12px; text-align: center; border-radius: 8px; margin-bottom: 20px;">
          <strong>⚡ LIMITED TIME: Extra ${discountPercentStr} OFF expires in 24 hours!</strong>
        </div>
      `
      : "";

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1a1a1a; font-size: 28px; margin: 0;">${STORE_NAME}</h1>
            <p style="color: #666; font-size: 14px; margin-top: 8px;">Your favorite Indian grocery store</p>
          </div>
          
          ${urgencyBanner}
          
          <div style="background: linear-gradient(135deg, ${isSecondEmail ? "#FF4444" : "#FF8C00"} 0%, ${isSecondEmail ? "#FF8C00" : "#FFD700"} 100%); padding: 30px; border-radius: 12px; margin-bottom: 30px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0 0 10px 0; font-size: 24px;">${headerText}</h2>
            <p style="color: #ffffff; margin: 0; font-size: 16px;">${subHeaderText}</p>
          </div>

          <div style="margin-bottom: 30px;">
            <h3 style="color: #1a1a1a; font-size: 18px; margin-bottom: 15px;">Your Cart Items</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f8f8f8;">
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Item</th>
                  <th style="padding: 12px; text-align: center; font-weight: 600;">Qty</th>
                  <th style="padding: 12px; text-align: right; font-weight: 600;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${cartItemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding: 15px 12px; font-weight: 700; font-size: 16px;">Total</td>
                  <td style="padding: 15px 12px; text-align: right; font-weight: 700; font-size: 16px; color: #FF8C00;">₹${sampleCartTotal.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div style="text-align: center; margin-bottom: 30px;">
            <a href="#" style="display: inline-block; background: linear-gradient(135deg, ${isSecondEmail ? "#FF4444" : "#FF8C00"} 0%, ${isSecondEmail ? "#FF8C00" : "#FFD700"} 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Complete Your Order Now
            </a>
          </div>

          <div style="background-color: ${isSecondEmail ? "#FFF3CD" : "#f8f8f8"}; padding: 20px; border-radius: 8px; margin-bottom: 30px; ${isSecondEmail ? "border: 2px dashed #FF8C00;" : ""}">
            <p style="color: ${isSecondEmail ? "#856404" : "#666"}; font-size: ${isSecondEmail ? "16px" : "14px"}; margin: 0; text-align: center; font-weight: ${isSecondEmail ? "600" : "normal"};">
              🎁 Use code <strong style="color: #FF8C00; font-size: 18px;">${discountCode}</strong> for ${discountPercentStr} off your order!
              ${isSecondEmail ? "<br><span style='font-size: 12px; color: #666;'>This is our best offer - don't miss out!</span>" : ""}
            </p>
          </div>

          <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              If you have any questions, reply to this email or contact us at support@desipantry.com
            </p>
            <p style="color: #999; font-size: 12px; margin-top: 10px;">
              © ${new Date().getFullYear()} ${STORE_NAME}. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Eye className="h-4 w-4" />
          Preview Emails
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Template Preview
          </DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="first" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="first">First Recovery Email</TabsTrigger>
            <TabsTrigger value="second">Second Recovery Email</TabsTrigger>
          </TabsList>
          <TabsContent value="first" className="flex-1 overflow-auto mt-4">
            <div className="bg-muted/50 rounded-lg p-2">
              <div className="bg-background rounded border text-sm mb-2 p-3">
                <span className="text-muted-foreground">Subject: </span>
                <span className="font-medium">You left items in your cart at {STORE_NAME}!</span>
              </div>
              <iframe
                srcDoc={generateEmailHtml(false)}
                className="w-full h-[500px] rounded border bg-white"
                title="First Email Preview"
              />
            </div>
          </TabsContent>
          <TabsContent value="second" className="flex-1 overflow-auto mt-4">
            <div className="bg-muted/50 rounded-lg p-2">
              <div className="bg-background rounded border text-sm mb-2 p-3">
                <span className="text-muted-foreground">Subject: </span>
                <span className="font-medium">⏰ Last chance! Your cart expires soon - Get {secondEmailDiscountPercent}% OFF!</span>
              </div>
              <iframe
                srcDoc={generateEmailHtml(true)}
                className="w-full h-[500px] rounded border bg-white"
                title="Second Email Preview"
              />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default EmailTemplatePreview;
