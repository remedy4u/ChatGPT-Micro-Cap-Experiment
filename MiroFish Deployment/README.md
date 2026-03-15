# MiroFish: развёртывание + консалтинговый план на 2 месяца

Этот документ — практичный план: как поднять `MiroFish` в проде и упаковать его в консалтинговое предложение с целевой выручкой **$10k–$15k за 2 месяца**.

## 1) Быстрый деплой (Docker, 1 VPS)

### 1.1. Требования

- Ubuntu 22.04+
- 4 vCPU / 8 GB RAM (минимум)
- Домен (например, `mirofish.yourdomain.com`)
- Docker + Docker Compose plugin

### 1.2. Подготовка сервера

```bash
sudo apt update && sudo apt install -y ca-certificates curl git
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

### 1.3. Клонирование и настройка

```bash
git clone https://github.com/666ghj/MiroFish.git
cd MiroFish
cp .env.example .env
```

Заполнить `.env` минимум этими переменными:

```env
LLM_API_KEY=...
LLM_BASE_URL=...
LLM_MODEL_NAME=qwen-plus
ZEP_API_KEY=...
```

### 1.4. Запуск

```bash
docker compose up -d
```

Проверка:

```bash
docker compose ps
docker compose logs -f --tail=100
```

По умолчанию:
- Frontend: `http://<server-ip>:3000`
- Backend: `http://<server-ip>:5001`

## 2) Прод: HTTPS и домен через Nginx

### 2.1. Установка Nginx + Certbot

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 2.2. Конфиг reverse-proxy

Создать `/etc/nginx/sites-available/mirofish`:

```nginx
server {
    server_name mirofish.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Активировать:

```bash
sudo ln -s /etc/nginx/sites-available/mirofish /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d mirofish.yourdomain.com
```

## 3) Что продавать как консалтинг

### Пакет A — Discovery + Pilot ($2k–$3k)
- 1 отраслевой кейс (например PR-кризис / запуск продукта / market scenario)
- Настройка seed-данных
- 1 отчёт + 1 workshop с командой клиента

### Пакет B — Decision Lab ($4k–$6k)
- 2–3 сценария и сравнение решений
- Кастомные промпты/шаблоны отчётов под руководителей
- 2–3 итерации с метриками качества

### Пакет C — Monthly Advisory ($1.5k–$3k в месяц)
- 2 сессии в месяц
- Поддержка и донастройка моделей
- Регулярные executive-summary отчёты

## 4) Математика цели $10k–$15k за 2 месяца

Реалистичный микс:
- 2 клиента на пакет B по $5k = $10k
- + 1 клиент на пакет A за $2.5k
- + 1 клиент Advisory на $1.5k–$2.5k

Итого: **$12k–$15k**.

## 5) GTM-план на 8 недель

### Недели 1–2
- Поднять demo-стенд (домен + HTTPS)
- Сделать 2 демонстрационных кейса в вашей нише
- Подготовить 10-слайдовый pitch deck

### Недели 3–4
- 50–80 целевых outreach (LinkedIn / Telegram / email)
- 10 discovery-звонков
- Закрыть 1 пилот

### Недели 5–6
- Доставить пилот с измеримым результатом
- Получить testimonial/case study
- Закрыть 2-й контракт

### Недели 7–8
- Upsell в Monthly Advisory
- Стандартизировать delivery (шаблоны отчётов, SOP)
- Масштабировать outbound

## 6) Операционные KPI

- `Leads/week`: 25+
- `Discovery calls/week`: 4+
- `Proposal-to-close`: 20%+
- `Average deal size`: $3.5k+
- `Gross margin`: 60%+

## 7) Риски и как снизить

- Высокая стоимость LLM inference → лимиты на длину и число прогонов, предварительный triage сценариев.
- “Вау-демо, но не платят” → продавать не платформу, а бизнес-решение с KPI клиента.
- Долгий кастом под каждого клиента → фиксированные пакеты и рамки изменений.

## 8) Следующий шаг (прямо сейчас)

1. Поднимите Docker-версию за 30–60 минут по шагам выше.
2. Выберите 1 вертикаль (fintech / retail / PR / public affairs).
3. Явно сформулируйте оффер из 1 страницы и начните outreach в тот же день.

---

Если хочешь, в следующем шаге я подготовлю:
- готовый `one-page offer` (RU/EN),
- шаблон discovery-call,
- шаблон коммерческого предложения на пакет B.
