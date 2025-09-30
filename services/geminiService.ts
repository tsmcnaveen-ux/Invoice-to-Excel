import { GoogleGenAI } from "@google/genai";

const CSV_HEADER = "Sr. No.,Date,Invoice No.,Item Name,HSN Code,GST Rate,Quantity,Unit,Unit Price/Unit,Taxable Amount,SGST,CGST,IGST Amount,Total Amount,Item Group,Purchase Ledger Type,Party GSTIN,Party Name,State";

const INVOICE_EXTRACTION_PROMPT = `
You are an expert invoice data extractor for Indian GST-compliant purchase invoices. Your task is to analyze the provided invoice image and extract specific fields.

**Instructions:**
1.  Carefully read the entire invoice image. First, identify the Vendor/Supplier and the Buyer/Customer.
2.  **Multi-line Item Descriptions:** If a single item's description is split across multiple lines in the image, you must consolidate them into a single continuous string for the 'Item Name' field. For example, if '16254-6 (WASHER' is on one line and 'SEAL)' is on the next, the 'Item Name' must be extracted as '16254-6 (WASHER SEAL)'.
3.  Extract the data for each line item. If the invoice contains multiple line items, create a new line for each.
4.  **Apply these Indian GST rules:**
    - To apply GST rules, you must compare the Vendor's/Supplier's state with the Buyer's/Customer's state.
    - If the supplier's state and the buyer's state are the SAME, calculate CGST and SGST. The total GST should be split equally between them. The IGST amount must be 0.
    - If the supplier's state and the buyer's state are DIFFERENT, the entire GST amount must be placed under IGST. CGST and SGST must be 0.
    - The buyer's state is typically found in the "Bill To" or "Ship To" address. If both are present, use the "Bill To" address. The supplier's state is found in the vendor's own address details, often near their name/logo.
5. **Calculate Total Amount:** For each line item, calculate a 'Total Amount' by summing the 'Taxable Amount', 'SGST Amount', 'CGST Amount', and 'IGST Amount'.

6.  **Output Format:**
    - Your final output must be ONLY the data, formatted as comma-separated values (CSV).
    - DO NOT include a header row.
    - If any field's value contains a comma (,), you MUST enclose the entire field in double quotes ("). For example: "Valve, Flanged".
    - DO NOT include any introductory text, explanations, code blocks, or markdown formatting (like \`\`\`csv).
    - Each line of your output should represent one item from the invoice.
    - The values on each line MUST be in this exact order:
      1. Serial Number (A sequential number starting from 1 for each item)
      2. Date (YYYY-MM-DD)
      3. Invoice Number
      4. Item Name
      5. HSN Code
      6. GST Rate (%)
      7. Quantity
      8. Unit (e.g., PCS, KG, LTR)
      9. Unit Price
      10. Taxable Amount
      11. SGST Amount
      12. CGST Amount
      13. IGST Amount
      14. Total Amount (Taxable Amount + SGST + CGST + IGST)
      15. Item Group (Use "Not Specified" if not found)
      16. Purchase Ledger Type (Always use "Purchase")
      17. Party GSTIN (Vendor's/Supplier's GSTIN)
      18. Party Name (Vendor's/Supplier's Name)
      19. State (Vendor's/Supplier's State)

Now, analyze the attached invoice and provide the output.
`;

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const extractInvoiceData = async (file: File): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const imagePart = await fileToGenerativePart(file);
    const textPart = { text: INVOICE_EXTRACTION_PROMPT };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
    });

    const modelResponse = response.text?.trim();
    if (!modelResponse) {
      return "";
    }

    return `${CSV_HEADER}\n${modelResponse}`;
};