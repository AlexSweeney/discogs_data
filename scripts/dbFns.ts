import { COUNTRIES, FORMATS, GENRES, STYLES, YEARS } from "../src/options";
import { SearchParam, StoredResult, TableName } from "../src/types";

const mongoose = require('mongoose');

mongoose.connect("mongodb://localhost:27017/test", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const SEARCH_REST_TIME = 1000;
const MAX_RESULTS = 10000;

const schemaValidator = function(value: any) {
  return value === null || typeof value === 'string';
};
const schemaMessage = (props: { value: string }) => `${props.value} is not a valid genre!`;
const stringOrNullType = {
  type: String,
  default: null,
  validate: {
    validator: schemaValidator,
    message: schemaMessage,
  }
};

const genreParamSchema = {
  genre: stringOrNullType,
  year: stringOrNullType,
  country: stringOrNullType,
  style: stringOrNullType,
  format: stringOrNullType,
  count: Number,
}; 

const GenreParam = mongoose.model('GenreParams', genreParamSchema);

const DB_OPTIONS: {
  [key: string]: string[]
} = {
  genre: GENRES,
  year: YEARS,
  country: COUNTRIES,
  style: STYLES,
  format: FORMATS
};

export async function seedAllParams(
  table: TableName, 
  keys: string[], 
  searchParam: SearchParam = {
    genre: null,
    year: null,
    country: null,
    style: null,
    format: null,
  }
) {
  const key = keys[0];
  const options = DB_OPTIONS[key];

  for(const option of options) {
    searchParam[key as keyof SearchParam] = option;

    const count = await getCount(searchParam, table);

    if(count > MAX_RESULTS) {
      await seedAllParams(table, keys.slice(1), searchParam)
    }
  }

  return true;
}

async function getDbResults(table: TableName) {
  if(table === 'genre') {
    return await GenreParam.find();
  } else {
    const errorMessage = `table: ${table} not implemented`;
    throw new Error(errorMessage);
  }
}

function getSearchParamsString(params: SearchParam) {
  const keys = Object.keys(params);
  let result = '';

  for(const key of keys) {
    if(params[key as keyof SearchParam]) {
      result += `&${key}=${params[key as keyof SearchParam]}`;
    }
  }

  return result;
}

async function getCount(params: SearchParam, tableName: TableName): Promise<number> {
  return new Promise(async (res, rej) => {
    console.log('getCount()')
    const storedResults = await getDbResults(tableName);
    const storedResult = storedResults.filter((result: StoredResult) => getIsMatchedResult(result, params))[0];

    const count = storedResult?.count || await fetchCount(params, tableName);
    res(count)
  })
}

async function fetchCount(params: SearchParam, tableName: TableName): Promise<number> {
  return new Promise(async (res, rej) => {
    const searchParams = getSearchParamsString(params);
    const url = `https://api.discogs.com/database/search?key=${process.env.DISCOGS_KEY}&secret=${process.env.DISCOGS_SECRET}&${searchParams}`;

    const response = await fetch(url);
    const data = await response.json();

    storeCount(params, data.pagination.items, tableName)

    setTimeout(() => {
      res(data.pagination.items)
    }, SEARCH_REST_TIME)
  })
}

function storeCount(params: SearchParam, count: number, tableName: TableName) {
  if(tableName === 'genre') {
    const param = new GenreParam({
      ...params,
      count
    });

    param.save().then((savedResult: string) => {
      console.log('Result saved successfully:', savedResult);
    })
  } else {
    const errorMessage = `storeCount(): no handler for ${tableName}`;
    throw new Error(errorMessage);
  };
}

function getIsMatchedResult(result: SearchParam, params: SearchParam) {
  return (
    result.genre === params.genre && 
    result.country === params.country && 
    result.year === params.year &&
    result.style === params.style &&
    result.format === params.format
  )
}