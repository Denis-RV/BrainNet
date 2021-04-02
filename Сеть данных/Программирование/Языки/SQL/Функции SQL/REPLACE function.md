==REPLACE(s, search item, `replacement item`)==
s - строка, которую будем изменять, search item - искомый элемент, replacement item - на что будем заменять. Если мы не используем replacement item, то функция удаляет все символы, совпадающие с search item.
	
***Примеры:***
```sql
SQL> select REPLACE('Hello, how are you? What is your name?', 'o', '**') Go from dual;

GO
------------------------------------------
Hell**, h**w are y**u? What is y**ur name?
```
---
*tags:* #database, #sql, #sqlFunction #single-row_func #character_func 