import { useEffect, useState } from "react";
import supabase from "@/lib/supabase"; // Adjust the import path as needed

export default function TestSupabaseConnection() {
    const [message, setMessage] = useState("Testing connection...");

    useEffect(() => {
        async function testConnection() {
            // Simple test: fetch current user (null if none logged in)
            const { data, error } = await supabase.auth.getSession();

            if (error) {
                setMessage(`Error: ${error.message}`);
            } else {
                setMessage(`Connected! Session: ${JSON.stringify(data?.session)}`);
            }
        }

        testConnection();
    }, []);

    return <div className="p-4 border rounded">{message}</div>;
}
