import type { TransactionType } from "@/types";

export type TransactionFlow = "cash" | "transfer";
export type DropdownName = "currency" | "rubro" | "categoria";
export type SearchName = "rubro" | "categoria";

export type TransactionFormFields = {
  amount: string;
  currency: string;
  date: string;
  description: string;
  categoryDetail: string;
  fromAccountId: string;
  toAccountId: string;
  fromBankAccountId: string;
  toBankAccountId: string;
  fromWalletId: string;
  toWalletId: string;
  contactId: string;
  category: string;
};

export type TransactionFormState = {
  type: TransactionType;
  flowMethod: TransactionFlow;
  dropdowns: {
    currencyOpen: boolean;
    rubroOpen: boolean;
    categoriaOpen: boolean;
  };
  searches: {
    rubro: string;
    categoria: string;
  };
  form: TransactionFormFields;
};

export type TransactionFormAction =
  | { type: "set_type"; value: TransactionType }
  | { type: "set_flow"; value: TransactionFlow }
  | { type: "set_dropdown"; name: DropdownName; value: boolean }
  | { type: "close_dropdowns" }
  | { type: "set_search"; name: SearchName; value: string }
  | { type: "set_form_field"; name: keyof TransactionFormFields; value: string }
  | { type: "set_form_fields"; values: Partial<TransactionFormFields> }
  | { type: "reset_all" };

const createInitialForm = (): TransactionFormFields => ({
  amount: "",
  currency: "ARS",
  date: new Date().toISOString().split("T")[0],
  description: "",
  categoryDetail: "",
  fromAccountId: "",
  toAccountId: "",
  fromBankAccountId: "",
  toBankAccountId: "",
  fromWalletId: "",
  toWalletId: "",
  contactId: "",
  category: "",
});

export const createInitialState = (): TransactionFormState => ({
  type: "expense",
  flowMethod: "cash",
  dropdowns: {
    currencyOpen: false,
    rubroOpen: false,
    categoriaOpen: false,
  },
  searches: {
    rubro: "",
    categoria: "",
  },
  form: createInitialForm(),
});

export function transactionFormReducer(
  state: TransactionFormState,
  action: TransactionFormAction,
): TransactionFormState {
  switch (action.type) {
    case "set_type":
      return { ...state, type: action.value };
    case "set_flow":
      return { ...state, flowMethod: action.value };
    case "set_dropdown":
      return {
        ...state,
        dropdowns: {
          ...state.dropdowns,
          [`${action.name}Open`]: action.value,
        } as TransactionFormState["dropdowns"],
      };
    case "close_dropdowns":
      return {
        ...state,
        dropdowns: {
          currencyOpen: false,
          rubroOpen: false,
          categoriaOpen: false,
        },
      };
    case "set_search":
      return {
        ...state,
        searches: {
          ...state.searches,
          [action.name]: action.value,
        },
      };
    case "set_form_field":
      return {
        ...state,
        form: {
          ...state.form,
          [action.name]: action.value,
        },
      };
    case "set_form_fields":
      return {
        ...state,
        form: {
          ...state.form,
          ...action.values,
        },
      };
    case "reset_all":
      return createInitialState();
    default:
      return state;
  }
}
