
// P7: Tracking System

export function trackingRoutes(app) {
    
    // 1. OPEN PIXEL
    app.get("/t/open/:messageId", (req, res) => {
      const { messageId } = req.params;
      console.log(`[TRACKING] OPEN DETECTED for msg: ${messageId}`);
      
      // In a real DB, you would update the message status here.
      // Since we are file-based/local-first, we just log it. 
      // P8 could involve a webhook to push this back to frontend.
  
      // Return transparent 1x1 GIF
      const img = Buffer.from(
        "R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
        "base64"
      );
      res.set("Content-Type", "image/gif");
      res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.send(img);
    });
  
    // 2. CLICK REDIRECT
    app.get("/t/click/:messageId", (req, res) => {
      const { messageId } = req.params;
      const targetUrl = decodeURIComponent(req.query.url || "");
      
      console.log(`[TRACKING] CLICK DETECTED for msg: ${messageId} -> ${targetUrl}`);
      
      if (!targetUrl || !targetUrl.startsWith('http')) {
          return res.status(400).send("Invalid URL");
      }
  
      res.redirect(targetUrl);
    });

    // 3. UNSUBSCRIBE
    app.get("/unsubscribe/:prospectId/:channel", (req, res) => {
        const { prospectId, channel } = req.params;
        console.log(`[COMPLIANCE] UNSUBSCRIBE REQUEST: ${prospectId} on ${channel}`);
        
        // Return a nice HTML page
        res.send(`
            <html>
                <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                    <h1 style="color: #16a34a;">Désinscription confirmée</h1>
                    <p>L'adresse liée à l'ID <strong>${prospectId}</strong> ne recevra plus de messages via <strong>${channel}</strong>.</p>
                </body>
            </html>
        `);
    });
}
