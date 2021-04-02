- Функция ==LOWER(s)==, где s - это строка, текст. В эту функцию мы помещяем строки, которые мы хотим уменьшить.

***Примеры:***
```sql
SQL> select first_name, LOWER(first_name) from employees;

FIRST_NAME           LOWER(FIRST_NAME)
-------------------- --------------------
Ellen                ellen
Sundar               sundar
Mozhe                mozhe
```
Также мы можем передать в функцию свой параметр:
```sql
SQL> select LOWER('Privet, HOW ARe YoU?') from dual;
LOWER('PRIVET,HOWARE
--------------------
privet, how are you?
```
Эту функцию полезно использовать в where:
```sql
select * from employees where LOWER(first_name) = 'david';
```
	
---
*теги:* #database, #sql, #sqlFunction #character_func #single-row_func 