# abstract class Reader
*Direct Known Subclasses:* [[class InputStremaReader]], [[class BufferedReader]]
*tegs:* #javaClass #java
*description:* Посимвользное чтение байтов. 

---
### Методы класса:
- read() - читает 1 символ из потока и возвращает его значение типа int. Если данных нет, возвращается -1.
- read(char[] array) - читает массив символов из потока.
- close() - закрывает поток.
- ready() - сообщает, готов ли поток к чтению данных.
- skip(long n) - пропускает n символов.
- transferTo(Writer out) - читает все символы из reader и пишет их в writer.