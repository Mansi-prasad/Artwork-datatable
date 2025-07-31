import { useState, useEffect, useRef } from "react";
import "./App.css";
// PrimeReact
import { DataTable, type DataTablePageEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { OverlayPanel } from "primereact/overlaypanel";
// PrimeReact style
import "primereact/resources/themes/bootstrap4-light-purple/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
type Artwork = {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string;
  date_start: number;
  date_end: number;
};

// Custom event type for row selection
type RowSelectionChangeEvent<T extends any[]> = {
  value: T;
};
function App() {
  const opRef = useRef<OverlayPanel>(null);
  // for table state
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [first, setFirst] = useState<number>(0);
  // for row selection state
  const [rowsToSelect, setRowsToSelect] = useState<number>(0);

//  row selection (global)
  const [selectedRows, setSelectedRows] = useState<Artwork[]>([]);

  // fetch data from API by page
  const fetchArtworks = async (page: number, updateTable: boolean = true) => {
    setLoading(true);
    try {
      const res = await fetch(`https://api.artic.edu/api/v1/artworks?page=${page}`);
      const json = await res.json();

      const mapped: Artwork[] = json.data.map((item: any) => ({
        id: item.id,
        title: item.title,
        place_of_origin: item.place_of_origin,
        artist_display: item.artist_display,
        inscriptions: item.inscriptions,
        date_start: item.date_start,
        date_end: item.date_end,
      }));
      
    if (updateTable) {
      setArtworks(mapped);
      setTotalRecords(json.pagination.total);
    }
    return mapped;
    } catch (error) {
      console.error("Error to fetch the data:", error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // loading first page on intitial render
  useEffect(() => {
    fetchArtworks(1);
  }, []);

  // handle table pagination
  const onPage = (event: DataTablePageEvent) => {
    setFirst(event.first);
    const newPage = event.page !== undefined ? event.page + 1 : 1;
    fetchArtworks(newPage);
  };

  const titleHeader = (
    <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <i className="pi pi-angle-down" style={{ cursor: "pointer" }} onClick={(e) => opRef.current?.toggle(e)}></i>
      Title
    </span>
  );

// handle row selection change
   const onSelectionChange = (e: RowSelectionChangeEvent<Artwork[]>) => {
    setSelectedRows(e.value ?? []);
  };

  // Row is selected if it exists in selectedRows
 const isRowSelected = (row: Artwork) =>
    selectedRows.some((r) => r.id === row.id);

  // Handle submit from OverlayPanel (custom number of rows)
const handleSubmit = async () => {
    if (rowsToSelect <= 0) return;

    let remaining = rowsToSelect;
    let page = 1;
    const newSelected: Artwork[] = [];
    // fetching pages until required number of rows are selected 
    while (remaining > 0 && newSelected.length < totalRecords) {
      const pageData = await fetchArtworks(page);

      const rowsFromPage = pageData.slice(0, remaining);
      newSelected.push(...rowsFromPage);

      remaining -= rowsFromPage.length;
      page++;
    }

    setSelectedRows(newSelected);
    opRef.current?.hide();

    // Go back to page 1 so user sees the first selected rows
    setFirst(0);
    fetchArtworks(1);
  };

  return (
    <div>
      <DataTable<any>
        value={artworks}
        lazy
        paginator
        rows={12}
        totalRecords={totalRecords}
        first={first}
        onPage={onPage}
        loading={loading}
        selection={artworks.filter(isRowSelected)}
        onSelectionChange={onSelectionChange}
        dataKey="id"
      >
        <Column selectionMode="multiple" headerStyle={{ width: "3rem" }}></Column>
        <Column field="title" header={titleHeader} />
        <Column field="place_of_origin" header="Place of Origin"></Column>
        <Column field="artist_display" header="Artist Display"></Column>
        <Column field="inscriptions" header="Inscriptions"></Column>
        <Column field="date_start" header="Start Date"></Column>
        <Column field="date_end" header="End Date"></Column>
      </DataTable>

      {/* Overlay Panel */}
      <OverlayPanel ref={opRef}>
        <div>
          <input
            type="number"
            min="1"
            max={artworks.length}
            value={rowsToSelect || ""}
            onChange={(e) => setRowsToSelect(parseInt(e.target.value) || 0)}
           className="row-selection-input"
        placeholder="Select rows...."
          />
          <button
            onClick={handleSubmit}
            className="btn"
          >
            Submit
          </button>
        </div>
      </OverlayPanel>
    </div>
  );
}
export default App;
