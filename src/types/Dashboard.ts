// types/Dashboard.ts
export type Dataset = {
  labels: string[];
  data: number[];
};

export type DashboardStats = {
  area: Dataset;        // meses
  bar: Dataset;         // categorías
  pieStatus: Dataset;   // estados
  piePublished: Dataset;// publicados vs no
};
