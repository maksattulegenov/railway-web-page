#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Простой Telegram бот для сбора данных пользователей и подписей
"""

import json
import base64
import os
import asyncio
from datetime import datetime
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, ConversationHandler, filters, ContextTypes
from telegram import WebAppInfo

# Токен бота
BOT_TOKEN = "7993103484:AAGtwbds-Hzdhpf_lxZr2Xf3YOtvSA1K6VE"

# URL веб-приложения
WEB_APP_URL = "https://railway-web-page-production.up.railway.app"

# Состояния разговора
FIO, BIRTH_DATE, PHONE, IIN, SIGNATURE = range(5)

# Создаем папку для подписей
os.makedirs("signatures", exist_ok=True)

# Временное хранилище данных пользователей
user_data_storage = {}

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Начальная команда"""
    user_id = update.effective_user.id
    user_data_storage[user_id] = {}
    
    await update.message.reply_text(
        "👋 Добро пожаловать!\n\n"
        "Я помогу вам заполнить анкету.\n"
        "Для начала, пожалуйста, введите ваше ФИО:"
    )
    return FIO

async def get_fio(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Получаем ФИО"""
    user_id = update.effective_user.id
    fio = update.message.text.strip()
    
    if len(fio) < 3:
        await update.message.reply_text("❌ Пожалуйста, введите корректное ФИО:")
        return FIO
    
    user_data_storage[user_id]['fio'] = fio
    
    await update.message.reply_text(
        f"✅ ФИО: {fio}\n\n"
        "📅 Теперь введите дату рождения в формате ДД.ММ.ГГГГ\n"
        "Например: 15.05.1990"
    )
    return BIRTH_DATE

async def get_birth_date(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Получаем дату рождения"""
    user_id = update.effective_user.id
    birth_date = update.message.text.strip()
    
    # Простая проверка формата даты
    try:
        datetime.strptime(birth_date, "%d.%m.%Y")
    except ValueError:
        await update.message.reply_text("❌ Неверный формат даты. Введите в формате ДД.ММ.ГГГГ:")
        return BIRTH_DATE
    
    user_data_storage[user_id]['birth_date'] = birth_date
    
    await update.message.reply_text(
        f"✅ Дата рождения: {birth_date}\n\n"
        "📱 Теперь введите номер телефона в формате +7XXXXXXXXXX:"
    )
    return PHONE

async def get_phone(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Получаем телефон"""
    user_id = update.effective_user.id
    phone = update.message.text.strip()
    
    # Простая проверка телефона
    if not (phone.startswith('+7') and len(phone) == 12 and phone[2:].isdigit()):
        await update.message.reply_text("❌ Неверный формат телефона. Введите в формате +7XXXXXXXXXX:")
        return PHONE
    
    user_data_storage[user_id]['phone'] = phone
    
    await update.message.reply_text(
        f"✅ Телефон: {phone}\n\n"
        "🆔 Теперь введите ИИН (12 цифр):"
    )
    return IIN

async def get_iin(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Получаем ИИН"""
    user_id = update.effective_user.id
    iin = update.message.text.strip()
    
    # Проверка ИИН
    if not (iin.isdigit() and len(iin) == 12):
        await update.message.reply_text("❌ ИИН должен содержать 12 цифр:")
        return IIN
    
    user_data_storage[user_id]['iin'] = iin
    
    # Создаем кнопку для веб-приложения подписи
    keyboard = [
        [InlineKeyboardButton(
            "✍️ Поставить подпись", 
            web_app=WebAppInfo(url=WEB_APP_URL)
        )]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        f"✅ ИИН: {iin}\n\n"
        "📝 Теперь нужно поставить подпись.\n"
        "Нажмите кнопку ниже, чтобы открыть приложение для подписи:",
        reply_markup=reply_markup
    )
    return SIGNATURE

async def handle_signature(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обрабатываем подпись от веб-приложения"""
    user_id = update.effective_user.id
    
    try:
        # Парсим данные от веб-приложения
        data = json.loads(update.effective_message.web_app_data.data)
        
        if data.get('type') == 'signature_saved':
            # Получаем данные подписи
            image_data = data.get('image', '')
            timestamp = data.get('timestamp', str(int(datetime.now().timestamp() * 1000)))
            
            # Удаляем префикс data URL если есть
            if image_data.startswith('data:image/png;base64,'):
                image_data = image_data.replace('data:image/png;base64,', '')
            
            # Сохраняем подпись в файл
            filename = f"signatures/signature_{user_id}_{timestamp}.png"
            with open(filename, 'wb') as f:
                f.write(base64.b64decode(image_data))
            
            # Добавляем путь к подписи в данные пользователя
            user_data_storage[user_id]['signature_file'] = filename
            user_data_storage[user_id]['timestamp'] = timestamp
            
            # Сохраняем все данные в JSON
            json_filename = f"user_data_{user_id}_{timestamp}.json"
            with open(json_filename, 'w', encoding='utf-8') as f:
                json.dump(user_data_storage[user_id], f, ensure_ascii=False, indent=2)
            
            # Отправляем подтверждение с подписью
            with open(filename, 'rb') as f:
                await update.effective_message.reply_photo(
                    photo=f,
                    caption=(
                        "✅ Все данные успешно сохранены!\n\n"
                        f"👤 ФИО: {user_data_storage[user_id]['fio']}\n"
                        f"📅 Дата рождения: {user_data_storage[user_id]['birth_date']}\n"
                        f"📱 Телефон: {user_data_storage[user_id]['phone']}\n"
                        f"🆔 ИИН: {user_data_storage[user_id]['iin']}\n"
                        f"📄 Данные сохранены в: {json_filename}\n"
                        f"✍️ Подпись сохранена в: {filename}\n\n"
                        "Спасибо за заполнение анкеты! 🙏"
                    )
                )
            
            # Очищаем временные данные
            if user_id in user_data_storage:
                del user_data_storage[user_id]
            
            return ConversationHandler.END
            
        else:
            await update.effective_message.reply_text("❌ Неверный тип данных от веб-приложения")
            return SIGNATURE
            
    except Exception as e:
        print(f"Ошибка при обработке подписи: {e}")
        await update.effective_message.reply_text(
            "❌ Ошибка при сохранении подписи. Попробуйте еще раз."
        )
        return SIGNATURE

async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Отмена операции"""
    user_id = update.effective_user.id
    if user_id in user_data_storage:
        del user_data_storage[user_id]
    
    await update.message.reply_text(
        "❌ Операция отменена. Для начала заново отправьте /start"
    )
    return ConversationHandler.END

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Помощь"""
    await update.message.reply_text(
        "🤖 Бот для сбора анкетных данных\n\n"
        "Команды:\n"
        "/start - Начать заполнение анкеты\n"
        "/cancel - Отменить текущую операцию\n"
        "/help - Показать эту справку\n\n"
        "Бот собирает следующие данные:\n"
        "• ФИО\n"
        "• Дата рождения\n"
        "• Телефон\n"
        "• ИИН\n"
        "• Подпись (через веб-приложение)\n\n"
        "Все данные сохраняются локально в JSON файлы."
    )

def main():
    """Запуск бота"""
    print("🤖 Запуск бота...")
    
    # Создаем приложение
    application = Application.builder().token(BOT_TOKEN).build()
    
    # Создаем обработчик разговора
    conv_handler = ConversationHandler(
        entry_points=[CommandHandler('start', start)],
        states={
            FIO: [MessageHandler(filters.TEXT & ~filters.COMMAND, get_fio)],
            BIRTH_DATE: [MessageHandler(filters.TEXT & ~filters.COMMAND, get_birth_date)],
            PHONE: [MessageHandler(filters.TEXT & ~filters.COMMAND, get_phone)],
            IIN: [MessageHandler(filters.TEXT & ~filters.COMMAND, get_iin)],
            SIGNATURE: [MessageHandler(filters.StatusUpdate.WEB_APP_DATA, handle_signature)],
        },
        fallbacks=[CommandHandler('cancel', cancel)],
    )
    
    # Регистрируем обработчики
    application.add_handler(conv_handler)
    application.add_handler(CommandHandler('help', help_command))
    
    print(f"✅ Бот запущен! Веб-приложение: {WEB_APP_URL}")
    print("📁 Подписи будут сохраняться в папку 'signatures/'")
    print("📄 Данные пользователей сохраняются в JSON файлы")
    print("🛑 Для остановки нажмите Ctrl+C")
    
    # Запускаем бота
    application.run_polling()

if __name__ == '__main__':
    main()