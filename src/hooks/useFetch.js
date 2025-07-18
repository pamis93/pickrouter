import { useState, useEffect } from "react";

const useFetch = (url, options = {}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await fetch(url, options);
                if (!res.ok) throw new Error(`Error ${res.status}`);
                const result = await res.json();
                if (isMounted) setData(result);
            } catch (err) {
                if (isMounted) setError(err.message);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [url]);

    return { data, loading, error };
};

export default useFetch;
