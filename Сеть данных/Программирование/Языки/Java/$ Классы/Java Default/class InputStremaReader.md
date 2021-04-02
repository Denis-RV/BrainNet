# class InputStremaReader
*extends:* [[class Reader (abstract)]]
*теги:* #java/class 
*описание:* Позволяет читать символы из файлов. В конструктор необходимо передать [[class InputStream (abstract)]]. По умолчанию использует кодировку UTF-8, но можено ее изменить, передав ее в конструктор, сначала передва файл, а затем StandardCharsets.(кодировка).

---

### Методы:
- getEcnoding() - возвращает название кодировки
