export type TableName = 'genre';

export type SearchParam = {
  genre: string|null,
  year: string|null,
  country: string|null,
  style: string|null,
  format: string|null
};

export type StoredResult = {
  genre: string|null,
  year: string|null,
  country: string|null,
  style: string|null,
  format: string|null
  count: number
};