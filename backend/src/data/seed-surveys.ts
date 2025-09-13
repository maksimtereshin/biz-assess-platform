import { DataSource } from 'typeorm';
import { Survey } from '../entities';
import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export async function seedSurveys(dataSource: DataSource) {
  const logger = new Logger('SeedSurveys');
  const surveyRepository = dataSource.getRepository(Survey);

  // Check if surveys already exist
  const existingSurveys = await surveyRepository.count();
  if (existingSurveys > 0) {
    logger.log('Surveys already seeded, skipping...');
    return;
  }

  // Read survey data from JSON file
  const dataPath = path.join(__dirname, 'survey-data.json');
  const surveyData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  // Create survey entities
  const surveys = Object.values(surveyData).map((survey: any) => {
    return surveyRepository.create({
      id: survey.id,
      type: survey.type,
      name: survey.name,
      structure: survey.structure,
    });
  });

  await surveyRepository.save(surveys);
  logger.log(`Successfully seeded ${surveys.length} surveys`);
}
