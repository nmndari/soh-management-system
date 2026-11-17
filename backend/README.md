# СӨХ сервер (backend)

Node.js + Express + MS SQL Server. Админ вебийн API (`/api/v1/*`). API-ийн бүрэн жагсаалт: [docs/server-api.html](../docs/server-api.html).

## Ажиллуулах

1. Өгөгдлийн сан үүсгэнэ (нэг удаа):

   ```bash
   sqlcmd -S .\SQLEXPRESS -E -f 65001 -i database\mssql\01_create_database.sql
   sqlcmd -S .\SQLEXPRESS -E -f 65001 -b -i database\mssql\02_schema.sql
   sqlcmd -S .\SQLEXPRESS -E -f 65001 -b -i database\mssql\03_seed.sql
   sqlcmd -S .\SQLEXPRESS -E -I -f 65001 -b -i database\mssql\04_seed_app.sql
   ```

2. Тохиргоо хийнэ:

   ```bash
   cd backend
   copy .env.example .env      # JWT_ACCESS_SECRET-д урт санамсаргүй утга тавина
   npm install
   ```

3. Серверийг асаана:

   ```bash
   npm run dev                 # http://localhost:4000, файл өөрчлөгдөхөд дахин асна
   ```

   Шалгах: http://localhost:4000/health → `{"status":"ok","db":"ok"}`

4. Вебийг асаана (`web/` хавтаст `npm run dev`). Vite `/api/*` хүсэлтийг 4000 порт руу дамжуулна.

Туршилтын админ: `admin@soh.mn` / `Admin123!`

Туршилтын оршин суугч (апп): `99112233` утсаар `POST /api/v1/auth/resident/request-otp`. `OTP_DEV_MODE=true` үед SMS явахгүй, код серверийн консолд болон хариуны `devCode` талбарт ирнэ. **Бодит орчинд `OTP_DEV_MODE=false` болгоно.**

## Өгөгдлийн сантай холбогдох

| `DB_DRIVER` | Нэвтрэлт | Хэзээ |
|---|---|---|
| `msnodesqlv8` (анхдагч) | Windows нэвтрэлт, ODBC Driver 17 | Локал SQL Server Express |
| `tedious` | SQL нэвтрэлт (`DB_USER`, `DB_PASSWORD`, `DB_PORT`) | Docker, өөр компьютер. SQL Server дээр TCP болон SQL нэвтрэлтийг асаасан байх ёстой |

## Бүтэц (3 давхарга)

```
src/
├─ routes/index.js     Presentation: зам, эрх, validation
├─ controllers/        Presentation: req → service → res
├─ middlewares/        authenticate, requireRole, validate, errorHandler
├─ validators/         zod схемүүд
├─ services/           Business Logic
├─ repositories/       Data Access: parameterized SQL
├─ config/             env, MSSQL pool, транзакц
└─ utils/              token, огноо, хуудаслалт, алдаа
```

## Хэрэгжсэн хэсэг

**Админ веб (`/api/v1/*`):** нэвтрэлт, тохиргоо ба ангилал, хянах самбар, оршин суугчид, сарын төлбөр ба төлөлт, зардал, орлого, санхүүгийн тайлан, зарлал, хурал, санал асуулга, санал гомдол, мэдэгдэл.

**Оршин суугчийн апп (`/api/v1/app/*`):** OTP нэвтрэлт, апп тохиргоо, профайл, нүүр хуудас, зарлал, хурал (өөрийн орцынх), санал өгөх ба үр дүн, гомдол ба засварын хүсэлт (зурагтай), төлбөрийн түүх, зардал ба санхүүгийн тайлан, мэдэгдэл, төхөөрөмж (FCM token) бүртгэх.

Гомдлын зураг `uploads/complaints/` хавтаст хадгалагдаж `/uploads/...` замаар уншигдана.

Хараахан хийгээгүй:
- **SMS:** OTP-г бодитоор илгээх ([src/services/sms.service.js](src/services/sms.service.js)). Үйлчилгээ үзүүлэгч сонгосны дараа хэрэгжүүлнэ.
- **Push (FCM):** мэдэгдэл DB-д бичигдэж байгаа ч утсанд түлхэгдэхгүй ([src/services/push.service.js](src/services/push.service.js)). Firebase төсөл үүсгэсний дараа хэрэгжүүлнэ.
- Сарын төлбөр үүсгэх, сануулга илгээх цагийн ажил (cron), нууц үг сэргээх.
