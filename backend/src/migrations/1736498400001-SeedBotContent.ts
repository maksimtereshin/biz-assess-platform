import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedBotContent1736498400001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Seed welcome message
    await queryRunner.query(`
      INSERT INTO bot_content (content_key, content_value, content_type, language)
      VALUES ('welcome_message', 'Добро пожаловать в мастерскую Спроси у Богданова, {firstName}!', 'message', 'ru');
    `);

    // Seed main menu buttons
    await queryRunner.query(`
      INSERT INTO bot_content (content_key, content_value, content_type, language)
      VALUES
        ('main_button_checkup', '🔍 Чекап', 'button_text', 'ru'),
        ('main_button_booking', '📅 Запись на старт сессию', 'button_text', 'ru'),
        ('main_button_about', 'ℹ️ О проекте', 'button_text', 'ru'),
        ('main_button_faq', '❓ FAQ', 'button_text', 'ru'),
        ('main_button_referral', '🎁 Реферальная программа', 'button_text', 'ru'),
        ('main_button_admin', '🔧 Админ панель', 'button_text', 'ru');
    `);

    // Seed checkup submenu content
    await queryRunner.query(`
      INSERT INTO bot_content (content_key, content_value, content_type, language)
      VALUES
        ('checkup_submenu_title', 'Выберите действие:', 'message', 'ru'),
        ('checkup_submenu_start', '🚀 Начать Чекап', 'button_text', 'ru'),
        ('checkup_submenu_results', '📊 Мои результаты', 'button_text', 'ru'),
        ('checkup_submenu_referral', '🎁 Реферальная программа', 'button_text', 'ru'),
        ('checkup_submenu_back', '⬅️ Назад', 'button_text', 'ru');
    `);

    // Seed system messages
    await queryRunner.query(`
      INSERT INTO bot_content (content_key, content_value, content_type, language)
      VALUES ('wip_message', 'Эта функция находится в разработке. Скоро будет доступна!', 'message', 'ru');
    `);

    // Seed command descriptions
    await queryRunner.query(`
      INSERT INTO bot_content (content_key, content_value, content_type, language)
      VALUES
        ('command_start_desc', 'Главное меню бота', 'command_description', 'ru'),
        ('command_checkup_desc', 'Начать чекап-опрос', 'command_description', 'ru'),
        ('command_results_desc', 'Посмотреть результаты опросов', 'command_description', 'ru'),
        ('command_referral_desc', 'Реферальная программа', 'command_description', 'ru'),
        ('command_about_desc', 'О проекте', 'command_description', 'ru'),
        ('command_faq_desc', 'Часто задаваемые вопросы', 'command_description', 'ru'),
        ('command_admin_desc', 'Админ панель', 'command_description', 'ru');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Delete all seeded content
    await queryRunner.query(`
      DELETE FROM bot_content
      WHERE content_key IN (
        'welcome_message',
        'main_button_checkup',
        'main_button_booking',
        'main_button_about',
        'main_button_faq',
        'main_button_referral',
        'main_button_admin',
        'checkup_submenu_title',
        'checkup_submenu_start',
        'checkup_submenu_results',
        'checkup_submenu_referral',
        'checkup_submenu_back',
        'wip_message',
        'command_start_desc',
        'command_checkup_desc',
        'command_results_desc',
        'command_referral_desc',
        'command_about_desc',
        'command_faq_desc',
        'command_admin_desc'
      );
    `);
  }
}
