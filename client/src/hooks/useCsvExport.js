import { useState } from "react";
import toast from "react-hot-toast";
import { useAppContext } from "../context/useAppContext";
import { downloadCsvBlob } from "../lib/downloadCsv";


const useCsvExport = (url, filename) => {
  const { axios, getToken } = useAppContext();
  const [exporting, setExporting] = useState(false);

  const exportCsv = async (params = {}) => {
    setExporting(true);
    try {
      const response = await axios.get(url, {
        params,
        headers: { Authorization: `Bearer ${await getToken()}` },
        responseType: "blob",
      });

      downloadCsvBlob(response.data, typeof filename === "function" ? filename() : filename);
    } catch (error) {
      toast.error("Failed to export CSV");
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  return { exporting, exportCsv };
};

export default useCsvExport;
