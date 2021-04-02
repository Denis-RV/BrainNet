==TO_DATE(text, `format mask, nls_pharameters`) = D== - конвертация текста в дату. Если мы конвертируем замудренный текст, необходимо обяснить oracle, что есть что из этого текста. Есть какой-то информации нет (о месяце), то oracle сам добавляет значение по умлочанию

Чтобы использовать моску, изучите [[TO_CHAR function]]

*Дополнительно*:
fm - удаялет пробелы:
`select hire\_date, TO\_CHAR(HIRE\_DATE, 'fmMonth') || ' Hello' from EMPLOYEES;`
th - добавляет склонение:
`select TO\_CHAR(Sysdate, 'DDth " of "mm ') from dual;`
sp - заставляет выводить не цифры, а слова:
`select TO\_CHAR(Sysdate, 'yyyysp, hh24sp:MIsp:Sssp') from dual;`
***Примеры:***
```sql
select To\_char(TO\_DATE('08?MAR%19'), 'dd-mon-yyyy hh24:mi:ss') from dual;  
select TO\_Date('18:40 of   17-SEP', 'HH24:MI "of" dd-Mon') from dual;  
select To\_Char(TO\_Date('28-Sep-19 15:16:18', 'dd-Mon-RR hh24:mi:ss')) from dual;  
select To\_Char(TO\_Date('28-Sep-19 15:16:18', 'dd-Mon-RR hh24:mi:ss'),'dd "day of "month". Time:" hh24:mi' ) from dual;  
  
select \* from EMPLOYEES where hire\_date \> '01-JAN-05';  
select \* from EMPLOYEES where hire\_date \> TO\_DATE('01-JAN-05', 'dd-MON-RR');  
select TO\_char(to\_date('18-SEP-10', 'DD-MON-RR'), 'Month') from dual;  
select to\_char(TO\_DATE('15?1987?17?18?19/09', 'hh24?YYYY?MI?SS?DD/mm'), 'dd-MON-yyyy hh24:mi:ss') from dual;
```
---
*теги:* #database, #sql, #sqlFunction, #conversion_func #single-row_func 