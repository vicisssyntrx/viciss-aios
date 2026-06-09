import { useState, useRef } from "react";
import { useAuth } from "@/contexts/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Papa from "papaparse";

interface Props { onClose: () => void; }

interface ParsedRow { date: string; completed: boolean; }

export default function CsvImport({ onClose }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ParsedRow[] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);

  const normalizeDate = (dateStr: string): string => {
    // If it's already YYYY-MM-DD, return it
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
  
    // Attempt standard parsing for formats with explicit months (e.g., "Mar 4 2024")
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) {
      throw new Error(`Invalid date format: ${dateStr}. Please use YYYY-MM-DD.`);
    }
  
    // If it's something ambiguous like 03/04/2024, reject it strictly
    if (new RegExp('^\\d{1,2}[/.-]\\d{1,2}[/.-]\\d{2,4}$').test(dateStr)) {
      throw new Error(`Ambiguous date format: ${dateStr}. Please convert to YYYY-MM-DD in your spreadsheet.`);
    }
  
    return dateObj.toISOString().split("T")[0];
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(null);
    setErrors([]);

    Papa.parse(file, {
      skipEmptyLines: true,
      complete: (results) => {
        const rows: ParsedRow[] = [];
        const errs: string[] = [];
        const seen = new Set<string>();

        const data = results.data as string[][];
        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          if (i === 0 && row[0]?.toLowerCase() === 'date') continue;
          if (row.length < 2) { errs.push(`Row ${i + 1}: invalid format`); continue; }

          const dateRaw = String(row[0]).trim();
          let date = "";
          try {
            date = normalizeDate(dateRaw);
          } catch (err: Error | unknown) {
            errs.push(`Row ${i + 1}: ${err.message}`);
            continue;
          }
          
          const val = String(row[1]).trim();

          if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { errs.push(`Row ${i + 1}: invalid date "${dateRaw}"`); continue; }
          if (val !== "0" && val !== "1" && val.toLowerCase() !== "true" && val.toLowerCase() !== "false") { 
            errs.push(`Row ${i + 1}: value must be 0 or 1`); continue; 
          }
          if (seen.has(date)) { errs.push(`Row ${i + 1}: duplicate date "${dateRaw}"`); continue; }
          if (new Date(date) > new Date()) { errs.push(`Row ${i + 1}: future date "${date}"`); continue; }
          
          seen.add(date);
          rows.push({ date, completed: val === "1" || val.toLowerCase() === "true" });
        }
        
        rows.sort((a, b) => a.date.localeCompare(b.date));
        setPreview(rows);
        setErrors(errs);
      },
      error: (error: Error) => {
        toast.error("Failed to parse CSV: " + error.message);
      }
    });
  };

  const doImport = async () => {
    if (!preview || !user) return;
    setImporting(true);

    try {
      // 1. Map preview to expected payload
      const payload = preview.map((row) => ({
        date: row.date,
        total_count: 1,
        completed_count: row.completed ? 1 : 0,
        shield_used: false,
      }));

      // 2. Call the bulk import RPC
      // @ts-expect-error - Types not generated for this RPC yet
      const { data, error } = await supabase.rpc('bulk_import_daily_logs', {
        p_logs: payload as Record<string, unknown>
      });

      if (error) throw error;
      
      const response = data as { success?: boolean; message?: string } | null;
      if (response && !response.success) {
        throw new Error(response.message || "Unknown server error");
      }

      toast.success("Import complete!");
      qc.invalidateQueries(); // Refresh the whole dashboard
      onClose();
    } catch (error: unknown) {
      toast.error("Import failed: " + error.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="glass rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">📤 Import History</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Upload a <code className="text-primary">CSV</code> with format: <code className="text-primary">date, completed</code> (1 = done, 0 = missed). No coins or shields are awarded from imports.
        </p>

        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileUpload}
        />
        <Button onClick={() => fileRef.current?.click()} variant="secondary" className="w-full mb-4">
          <Upload className="h-4 w-4 mr-2" /> Select CSV File
        </Button>

        {errors.length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive max-h-32 overflow-y-auto">
            {errors.map((e, i) => <p key={i}>{e}</p>)}
          </div>
        )}

        {preview && (
          <>
            <div className="glass rounded-xl p-3 mb-4 text-sm">
              <p className="text-foreground">📊 {preview.length} days total</p>
              <p className="text-muted-foreground">{preview.filter((r) => r.completed).length} completed, {preview.filter((r) => !r.completed).length} missed</p>
            </div>
            <Button onClick={doImport} disabled={importing || preview.length === 0} className="w-full bg-primary text-primary-foreground">
              {importing ? "Importing..." : `Import ${preview.length} Days`}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
