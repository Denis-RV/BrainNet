# class RandomAccessFile
*extends:*
*implements:* 
*tegs:* #javaClass #java
*description:* Класс позволяет получить доступ к любому месту в файле. В конструктор передаем File и режим чтений ("r" - только чтение, "rw" - чтение и запись)).

---
### Методы класса:
- seek(long n) - перемещается к указанной поизции.
- writeBytes(String s) - перезаписывает символы в фалйе
- read(byte[] b) - читает байты
