import { useCallback, useReducer } from "react";
import type { TransactionType } from "@/types";
import {
  createInitialState,
  transactionFormReducer,
  type DropdownName,
  type SearchName,
  type TransactionFormFields,
} from "../components/TransactionForm.machine";

export function useTransactionForm() {
  const [state, dispatch] = useReducer(
    transactionFormReducer,
    undefined,
    createInitialState,
  );

  const setType = useCallback((value: TransactionType) => {
    dispatch({ type: "set_type", value });
  }, []);

  const setFlowMethod = useCallback((value: "cash" | "transfer") => {
    dispatch({ type: "set_flow", value });
  }, []);

  const setDropdownOpen = useCallback((name: DropdownName, value: boolean) => {
    dispatch({ type: "set_dropdown", name, value });
  }, []);

  const closeDropdowns = useCallback(() => {
    dispatch({ type: "close_dropdowns" });
  }, []);

  const setSearch = useCallback((name: SearchName, value: string) => {
    dispatch({ type: "set_search", name, value });
  }, []);

  const setFormField = useCallback(
    (name: keyof TransactionFormFields, value: string) => {
      dispatch({ type: "set_form_field", name, value });
    },
    [],
  );

  const setFormFields = useCallback(
    (values: Partial<TransactionFormFields>) => {
      dispatch({ type: "set_form_fields", values });
    },
    [],
  );

  const resetAll = useCallback(() => {
    dispatch({ type: "reset_all" });
  }, []);

  return {
    state,
    actions: {
      setType,
      setFlowMethod,
      setDropdownOpen,
      closeDropdowns,
      setSearch,
      setFormField,
      setFormFields,
      resetAll,
    },
  };
}
