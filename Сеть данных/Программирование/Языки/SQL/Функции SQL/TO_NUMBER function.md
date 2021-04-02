==TO_NUMBER(text, `format mask, nls_parameters`) = N== - перевод текста в число.

***Примеры:***
```sql
select TO\_NUMBER('$8534855.77', '$9999999999.999') from dual;  
select TO\_NUMBER('485,5.77', '999999999.999') from dual;  
select TO\_NUMBER('<485,5.77>', '999999999.999PR') from dual;  
select TO\_CHAR(3.28, '99.9') from dual;  
select TO\_NUMBER('3.28', '99.9') from dual; \--mistake
select TO\_NUMBER('3.28', '99.99') from dual;
```
---
*теги:* #database, #sql, #sqlFunction #single-row_func #conversion_func 