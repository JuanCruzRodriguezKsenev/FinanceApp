"use client";

import styles from "./List.module.css";
// ✅ Importamos los componentes específicos para el renderizado
import CreditCard from "../CreditCard/CreditCard";
import DebitCard from "../DebitCard/DebitCard";

import GenericList, {
  ListAlignment,
  ListDirection,
} from "@/components/Generic/List/List";
import GenericFilter from "@/components/Generic/Filter/Filter";
import {
  EnrichedCard,
  CARD_FILTER_FIELDS,
  CARD_SORT_OPTIONS,
} from "@/app/cards/constants";
import { PaymentCard, CreditCardData, DebitCardData } from "@/types"; // Importamos CreditCardData y DebitCardData
import { FilterLogic } from "@/hooks/useDataFilters";

interface Props {
  cards: EnrichedCard[];
  selectedId: number | null;
  actions: {
    deleteCard: (id: number) => void;
    toggleSelect: (card: PaymentCard) => void;
    openEditModal: (card: PaymentCard) => void;
    saveCard: (cardData: any, id: number | null) => void;
  };
  filterLogic: FilterLogic<EnrichedCard>;
}

export default function PaymentCardsList({
  cards,
  selectedId,
  actions,
  filterLogic,
}: Props) {
  // USO SEGURO: Resolvemos processedCards.
  const processedCards = filterLogic?.processedData || cards; // --- CONFIGURACIÓN DE LAYOUT ---

  const listDirection: ListDirection = "horizontal";
  const listAlignment: ListAlignment = "center";
  const listGap: string = "2rem"; // Función para renderizar el componente específico (CreditCard o DebitCard)

  const renderCard = (card: EnrichedCard) => {
    // Props comunes a ambos tipos de tarjetas
    const commonProps = {
      onDelete: actions.deleteCard,
      onEdit: actions.openEditModal,
      onSelect: actions.toggleSelect,
      isSelected: card.id === selectedId,
    }; // Renderizado condicional basado en el tipo

    if (card.type === "credit") {
      // CORRECCIÓN CLAVE: Afinar el tipo para que CreditCardData cumpla su contrato
      return <CreditCard data={card as CreditCardData} {...commonProps} />;
    } // CORRECCIÓN CLAVE: Afinar el tipo para DebitCardData

    return <DebitCard data={card as DebitCardData} {...commonProps} />;
  }; // Determinamos si mostrar el mensaje de "No filters" o "No cards"

  const isFiltered =
    filterLogic &&
    Object.values(filterLogic.filters).some((v) => v && v !== "all");
  const emptyMessage = isFiltered
    ? "No cards match the current filters."
    : "No cards found.";

  return (
    <div className={styles.listContainer}>
      {/* 1. ÁREA DE FILTROS/TOOLBAR (Solo si filterLogic existe) */}{""}
      {filterLogic && (
        <GenericFilter<EnrichedCard>
          searchQuery={filterLogic.searchQuery}
          setSearchQuery={filterLogic.setSearchQuery}
          filters={filterLogic.filters}
          setFilter={filterLogic.setFilter}
          sortConfig={filterLogic.sortConfig}
          setSortConfig={filterLogic.setSortConfig}
          getUniqueValues={filterLogic.getUniqueValues}
          clearFilters={filterLogic.clearFilters}
          filterFields={CARD_FILTER_FIELDS}
          sortOptions={CARD_SORT_OPTIONS}
          placeholder="Search by Bank or Holder..."
        />
      )}
      {/* 2. LISTA DINÁMICA DE TARJETAS */}{""}
      {processedCards.length === 0 ? (
        <p className={styles.emptyState}>{emptyMessage}</p>
      ) : (
        <GenericList<EnrichedCard>
          items={processedCards}
          renderItem={renderCard}
          direction={listDirection}
          alignment={listAlignment}
          gap={listGap}
          className={styles.cardsGrid}
        />
      )}{""}
    </div>
  );
}
