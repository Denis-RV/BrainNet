# class InputStream

*Direct Known Subclasses:* [[class FileInputStream]], [[class BufferedInputStream]]
*tags:* #java #javaAbstractClass
*description:* преобразует данные в поток входных байтов.

---
### Методы класса:
- read() - читает 1 байт и возвращает его значение типа int. Если данных нет, возвращается -1.
- read(byte[] array) - читает массив байтов. 
- available() - возвращает количество байтов, которые можно прочесть. Если в потоке закончились байты, возвращает 0.
- close() - закрывает поток.
- transferTo(OutputStream out) - читает все байты из входного потока и записывает их в выходной поток.