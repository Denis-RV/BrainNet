==NULLIF(value1, value2)== - возвращает null, если параметры равны между собой, и возвращает value1, если они не равны.

***Примеры:***
```sql
select NULLIF(18, 18) from dual; \--null  
select NULLIF(17, 18) from dual; \--17  
select NULLIF('Hello', 'Hello') from dual;
```
---
*tegs:* #database, #sql, #sqlFunction #general_func #single-row_func 