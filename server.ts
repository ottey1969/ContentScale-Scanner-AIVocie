import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import * as cheerio from "cheerio";
import axios from "axios";
import { parseStringPromise } from "xml2js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock database for bulk jobs
const bulkJobs: Record<string, any> = {};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- SEO Scanner Logic ---
  const analyzeSEO = async (url: string) => {
    let targetUrl = url.trim();
    try {
      if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = 'https://' + targetUrl;
      }
      const response = await axios.get(targetUrl, { 
        timeout: 10000,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ContentScaleBot/1.0; +https://app.contentscale.site)' }
      });
      const html = response.data;
      const $ = cheerio.load(html);

      // Basic stats
      const title = $('title').text();
      const metaDesc = $('meta[name="description"]').attr('content') || '';
      $('script, style, nav, footer, header, iframe, noscript').remove();
      const text = $('body').text().replace(/\s+/g, ' ').trim();
      const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
      const h1Count = $('h1').length;
      const h2Count = $('h2').length;
      const h3Count = $('h3').length;
      const images = $('img').length;
      const imagesWithAlt = $('img[alt]').length;
      const internalLinks = $('a').filter((i, el) => {
        const href = $(el).attr('href');
        return href && (href.startsWith('/') || href.includes(new URL(targetUrl).hostname));
      }).length;
      const externalLinks = $('a').filter((i, el) => {
        const href = $(el).attr('href');
        return href && href.startsWith('http') && !href.includes(new URL(targetUrl).hostname);
      }).length;
      // Technical SEO Checks
      const hasArticleSchema = $('script[type="application/ld+json"]').text().includes('Article') || $('script[type="application/ld+json"]').text().includes('BlogPosting');
      const hasCanonical = $('link[rel="canonical"]').length > 0;
      const hasOgImage = $('meta[property="og:image"]').length > 0;
      const hasOgTitle = $('meta[property="og:title"]').length > 0;
      const hasTwitterCard = $('meta[name="twitter:card"]').length > 0;
      const hasViewport = $('meta[name="viewport"]').length > 0;
      const hasFavicon = $('link[rel="icon"], link[rel="shortcut icon"]').length > 0;
      const lang = $('html').attr('lang') || 'unknown';

      // Scoring Logic (Heuristic - will be refined by AI)
      let graaf = 20; 
      if (wordCount > 1000) graaf += 15;
      if (wordCount > 2000) graaf += 5;
      if (h2Count > 3) graaf += 5;
      if (externalLinks > 2) graaf += 5;
      graaf = Math.min(50, graaf);

      let craft = 10;
      if (h1Count === 1) craft += 10;
      if (images > 2 && imagesWithAlt === images) craft += 10;
      if (h3Count > 0) craft += 10;
      craft = Math.min(30, craft);

      let technical = 5;
      if (hasCanonical) technical += 3;
      if (metaDesc.length > 50) technical += 3;
      if (hasArticleSchema) technical += 4;
      if (hasOgImage && hasOgTitle) technical += 3;
      if (hasViewport) technical += 2;
      if (hasFavicon) technical += 5;
      technical = Math.min(20, technical);

      const score = graaf + craft + technical;

      return {
        success: true,
        url: targetUrl,
        title,
        metaDescription: metaDesc,
        score,
        metrics: { graaf, craft, technical },
        content_stats: { 
          wordCount, h1Count, h2Count, h3Count, 
          images, imagesWithAlt, internalLinks, externalLinks, 
          hasArticleSchema, hasCanonical, hasOgImage, hasTwitterCard,
          hasViewport, hasFavicon, lang
        },
        quality: score > 80 ? 'high_quality' : score > 60 ? 'moderate' : 'needs_improvement',
        raw_content: text.substring(0, 15000) // More context for AI
      };
    } catch (error: any) {
      return { success: false, url: targetUrl, error: error.message };
    }
  };

  // --- API Routes ---

  app.post("/api/scan", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });
    const result = await analyzeSEO(url);
    res.json(result);
  });

  app.post("/api/sitemap/urls", async (req, res) => {
    const { url } = req.body;
    try {
      let targetUrl = url.trim();
      if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = 'https://' + targetUrl;
      }
      const response = await axios.get(targetUrl, { timeout: 15000 });
      const result = await parseStringPromise(response.data);
      
      let urls: string[] = [];
      
      if (result.urlset && result.urlset.url) {
        urls = result.urlset.url.map((u: any) => u.loc[0]);
      } else if (result.sitemapindex && result.sitemapindex.sitemap) {
        // Handle sitemap index by fetching first few sitemaps (limit to prevent timeout)
        const sitemaps = result.sitemapindex.sitemap.map((s: any) => s.loc[0]).slice(0, 3);
        for (const sUrl of sitemaps) {
          try {
            const sResp = await axios.get(sUrl, { timeout: 10000 });
            const sResult = await parseStringPromise(sResp.data);
            if (sResult.urlset && sResult.urlset.url) {
              urls = [...urls, ...sResult.urlset.url.map((u: any) => u.loc[0])];
            }
          } catch (e) {}
        }
      }
      
      // Filter out non-content pages (common patterns)
      const filteredUrls = urls.filter(u => {
        const lower = u.toLowerCase();
        return !lower.includes('/tag/') && 
               !lower.includes('/category/') && 
               !lower.includes('/author/') && 
               !lower.includes('/page/') &&
               !lower.endsWith('.jpg') &&
               !lower.endsWith('.png') &&
               !lower.endsWith('.pdf');
      });

      res.json({ success: true, urls: filteredUrls, total: filteredUrls.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/scan/bulk-job", async (req, res) => {
    const { urls } = req.body;
    const jobId = Math.random().toString(36).substring(7);
    bulkJobs[jobId] = {
      id: jobId,
      status: 'running',
      total: urls.length,
      done: 0,
      results: []
    };

    // Run in background
    (async () => {
      for (const url of urls) {
        const result = await analyzeSEO(url);
        bulkJobs[jobId].results.push(result);
        bulkJobs[jobId].done++;
      }
      bulkJobs[jobId].status = 'done';
    })();

    res.json({ success: true, jobId });
  });

  app.get("/api/scan/bulk-job/:id", (req, res) => {
    const job = bulkJobs[req.params.id];
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json({ success: true, ...job });
  });

  app.get("/api/leaderboard", (req, res) => {
    res.json({ success: true, entries: [] });
  });

  app.get("/api/freelancers", (req, res) => {
    res.json({ success: true, freelancers: [] });
  });

  // --- Vapi Proxy Routes ---
  app.post("/api/voicebot/call", async (req, res) => {
    const vapiKey = req.headers["x-vapi-key"];
    if (!vapiKey) {
      return res.status(401).json({ error: "Vapi API Key missing" });
    }

    try {
      const response = await fetch("https://api.vapi.ai/call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${vapiKey}`,
        },
        body: JSON.stringify(req.body),
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/voicebot/status/:callId", async (req, res) => {
    const vapiKey = req.headers["x-vapi-key"];
    const { callId } = req.params;

    try {
      const response = await fetch(`https://api.vapi.ai/call/${callId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${vapiKey}`,
        },
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- License Validation Proxy (Mock for now) ---
  app.post("/api/license/validate", (req, res) => {
    const { key } = req.body;
    if (key && key.startsWith("CS-")) {
      res.json({ valid: true, plan: "voicebot", email: "user@example.com" });
    } else {
      res.status(400).json({ error: "Invalid license key" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
