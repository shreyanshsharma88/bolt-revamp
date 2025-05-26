/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type FC,
  type PropsWithChildren,
} from "react";
import { useFetchGroqModels, useLLMCall } from "../hooks";
import "react-toastify/dist/ReactToastify.css";
import { toast, ToastContainer, type ToastOptions } from "react-toastify";
import { Loader } from "../components";
import type { ILlmAPIResponse } from "../types";

export const GlobalProvider: FC<PropsWithChildren> = ({ children }) => {
  const LLMQuery = useLLMCall();
  const [llmData, setLlmData] = useState<ILlmAPIResponse | null>(null)
  useFetchGroqModels();

  const askLLM = useCallback(
    (prompt: string) => {
      return LLMQuery.mutate(prompt, {
        onSuccess: (data) => {
          setLlmData(data)
        }
      });
    },
    [LLMQuery]
  );

  const popToast = useCallback(
    (message: string, options?: ToastOptions) =>
      toast(message, {
        ...options,
      }),
    []
  );

  const values: IGlobalContextProps = useMemo(
    () => ({
      askLLM,
      LLMQuery,
      popToast,
    }),
    [LLMQuery, askLLM, popToast]
  );

  return (
    <GlobalContext.Provider value={values}>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      {LLMQuery.isPending && <Loader />}
      {children}
    </GlobalContext.Provider>
  );
};

const GlobalContext = createContext<IGlobalContextProps>({
  askLLM: (prompt: string) => {},
  LLMQuery: undefined as any,
  popToast: (message: string, options?: ToastOptions) => {
    toast(message, options);
  },
});

export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error("useGlobalContext must be used within a GlobalProvider");
  }
  return context;
};

interface IGlobalContextProps {
  askLLM: (prompt: string) => void;
  LLMQuery: ReturnType<typeof useLLMCall>;
  popToast: (message: string, options?: ToastOptions) => void;
}
