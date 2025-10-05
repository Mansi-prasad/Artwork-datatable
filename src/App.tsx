import { useState, useEffect, useRef } from "react";
import "./App.css";
// PrimeReact
import { DataTable, type DataTablePageEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { OverlayPanel } from "primereact/overlaypanel";
// PrimeReact style
import "primereact/resources/themes/lara-light-blue/theme.css";
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

function App() {

  const opRef = useRef<OverlayPanel>(null);
  // for table state
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [first, setFirst] = useState<number>(0);

  // for row selection state
  const [rowsToSelect, setRowsToSelect] = useState<number>(0);

  // store only IDs
  const [selectedRowIds, setSelectedRowIds] = useState<Set<number>>(new Set());

  // fetch data from API by page
  const fetchArtworks = async (page: number): Promise<Artwork[]> => {
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
      
      setArtworks(mapped);
      setTotalRecords(json.pagination.total);
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

  // Check if a row is selected
  const isRowSelected = (row: Artwork) => selectedRowIds.has(row.id);

  // Handle selection change (checkbox)
  const onSelectionChange = (selected: Artwork[]) => {
    const newSelectedIds = new Set(selectedRowIds);

    // Add newly selected
    selected.forEach((row) => newSelectedIds.add(row.id));

    // Remove unselected rows from the current page
    artworks.forEach((row) => {
      if (!selected.some((r) => r.id === row.id)) {
        newSelectedIds.delete(row.id);
      }
    });

    setSelectedRowIds(newSelectedIds);
  };

  // Handle custom row selection from OverlayPanel
const handleSubmit = async () => {
    if (rowsToSelect <= 0) return;

    // Fetch pages until required number of rows are selected
    let remaining = rowsToSelect;
    let page = 1;
    const newSelectedIds = new Set(selectedRowIds);

    while (remaining > 0 && newSelectedIds.size < totalRecords) {
      const pageData = await fetchArtworks(page);

      for (const row of pageData) {
        if (remaining <= 0) break;
        if (!newSelectedIds.has(row.id)) {
          newSelectedIds.add(row.id);
          remaining--;
        }
      }

      page++;
    }

    setSelectedRowIds(newSelectedIds);
    opRef.current?.hide();

    // Reset to page 1 so first selected rows visible
    setFirst(0);
    fetchArtworks(1);

  };

    const titleHeader = (
    <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <i className="pi pi-angle-down" style={{ cursor: "pointer" }} onClick={(e) => opRef.current?.toggle(e)}></i>
      Title
    </span>
  );
  
  return (
    <div className="table-con">
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
        onSelectionChange={(e) => onSelectionChange(e.value ?? [])}
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
            min={1}
            max={totalRecords}
            value={rowsToSelect || ""}
            onChange={(e) => setRowsToSelect(parseInt(e.target.value) || 0)}
            className="row-selection-input"
            placeholder="Select rows...."
          />
          <button
            onClick={handleSubmit}
            className="sub-btn"
          >
            Submit
          </button>
        </div>
      </OverlayPanel>
    </div>
  );
}
export default App;
