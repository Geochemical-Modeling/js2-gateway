export interface IFormData {
  species: string;
  temp: string;
  pH: string;
  feINPUT?: string;
  oINPUT?: string;
  co2INPUT?: string;
}

export interface IResultData {
  AMech: string;
  BMech: string;
  NMech: string;
  OMech: string;
  total: string;
  logTotal: string;
  species: string;
  reference: string;
  temp: string;
  pH: string;
}
