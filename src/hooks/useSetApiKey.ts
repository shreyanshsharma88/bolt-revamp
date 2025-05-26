import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const useSetApiKey = () => {};

const fetchGroqModels = async () => {
  const response = await axios.get("http://localhost:5174/api/models/Groq", {
    headers: {
      Accept: "*/*",
      "Accept-Language": "en-US,en;q=0.9",
      Connection: "keep-alive",
      Referer: "http://localhost:5173/",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36",
      "sec-ch-ua":
        '"Not A(Brand";v="8", "Chromium";v="132", "Google Chrome";v="132"',
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": '"Android"',
    },
    withCredentials: true,
    params: {},
  });
  return response.data;
};

export const useFetchGroqModels = () => {
  useQuery({
    queryKey: ["groqModels"],
    queryFn: fetchGroqModels,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: 1000 * 60 * 60,
  });
  return fetchGroqModels;
};
