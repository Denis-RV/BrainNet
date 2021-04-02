# Ampersand Substitution
*теги:* #sql #database #oracle_db
*описание:* ampersand позволяет делать подстановки значений в запросы, где например надо вводить номер id, чтобы вывести строку. 

---
## Single Ampersand
Когда вы используете `&ID`, oracle выдает окно для ввода значения для ID:
```
select FIRST_NAME, LAST_NAME, SALARY
from EMPLOYEES
where EMPLOYEE_ID = &ID;
```

*Для ввода строк необходимо использовать одинарные кавычки:* 
```sql
select FIRST_NAME, LAST_NAME, SALARY
    from EMPLOYEES
    where FIRST_NAME = '&any_name';
```
==Данная команда с кавычками неправлиьно работает в IDEA. Зато она прекрасно работает в консоли==

Ampersand можно испоьлзовать **для подстоновки любого значения:**
```sql
select &column from EMPLOYEES;
```

Запрос с группировкой ==тоже не работает в idea:==
```sql
select &&col from EMPLOYEES group by &col
```

**Мы можем вводить не только значения, но и целвые выражения:**
```sql
select &select_list
from &table_name
where&conditions
order by &col;
```

## Double Ampersand
Иногда нам нужно, чтобы в имени и фамелии была лишь одна буква. (см про знак % в [[SELECT#Дополнительные операторы]]). Мы можем сделать так:
```sql
select FIRST_NAME, LAST_NAME, SALARY
    from EMPLOYEES
    where FIRST_NAME like '%&name%'
      and LAST_NAME like '%&name%';
```
**Этот пример содержит проблемы:** наша задача состояла в том, чтобы в нашлись лиюди с одной и той же введенной буквой. Но нам приходится вводить ее два раза. ==Double Ampersand== позволяет нам одно введенное значение подставлять сразу в несколько мест:
```sql
select FIRST_NAME, LAST_NAME, SALARY
    from EMPLOYEES
    where FIRST_NAME like '%&&name%'
      and LAST_NAME like '%&name%';
```
**Если вы перезапустите этот запрос, oracle не будет снова спрашивать значение для name, т.к. он его сохранил после вервого раза.**