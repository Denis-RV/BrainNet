# class File
#javaClass
---

>Данный класс представляет файл (путь к файлу), но не представляет содержимое этого файла. Объект File предлагает более безопасный способ представить файл, чем простое указание имени файла в виде строки. Большинство классов, принимающие строковое имя файла, могут вместо этого взять объект File.

**extends:** Object
** implements:** Serializable, Comparable<File>
	
### Возможности

- Зачем нужен класс File?
- Как вывести содержимое каталога?
- Зачем создавать новый каталог?
- Что значит "асболютный путь файла"?
- Как получить абсолютный путь файла или каталога?
	
### Методы класса:
- mkdir() создает новый каталог.
- getAbsolutePath() возвращает строку с абсолютным путем файла.
- delete() удаляет файл или каталог.
	
### Подробно о возможностях

- Вывод содержимого каталога:

```java
if (file.isDirectory()) {
	String[] fileContents = file.list();
	for (int i = 0; I < fileContents.length; i++) {
		System.out.println(fileContents[i]);
	}
}
```