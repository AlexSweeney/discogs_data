import { seedAllParams } from "../scripts/dbFns";
import * as dotenv from 'dotenv';
dotenv.config();

const express = require('express');
const app = express();

let genreParamsSeeded;
let yearParamsSeeded = false;
let styleParamsSeeded = false;
let countryParamsSeeded = false;

async function seedParamsDbs() {
  genreParamsSeeded = await seedAllParams('genre', ['genre', 'year', 'country', 'style', 'format']);
  // yearParamsSeeded = await seedValidParams('year', ['year', 'style', 'country', 'genre', 'format']);
  // styleParamsSeeded = await seedValidParams('style', ['style', 'country', 'format', 'genre', 'year' ]);
  // countryParamsSeeded = await seedValidParams('country', ['country', 'format', 'genre', 'year', 'style']);
}

async function init() {
  await seedParamsDbs()
}

init()