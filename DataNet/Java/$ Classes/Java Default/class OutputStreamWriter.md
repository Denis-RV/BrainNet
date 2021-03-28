# class OutputStreamWriter
*extends:* [[class Writer (abstract)]]
*tegs:* #javaClass #java
*description:* Посимвольная запись байтов. В конструктор необъодимо пердеать [[class OutputStream (abstract)]]. Без второго параметраа перезаписывает файл, но если передать true, добавляет в файл данные.

---
- flush() - очищает буффер и отдает файлу все данные, которые в нем лежали.